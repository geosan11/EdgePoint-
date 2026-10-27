"""
EdgePoint+ Ingestion & Pipeline Orchestrator
Coordinates:
1. Polling fixtures and odds feeds (The Odds API / Mock)
2. Running quantitative math modeling (EdgeScore, EV%, Poisson, Props)
3. Constructing PointBlank Daily Parlay Slip
4. Detecting EdgeRadar steam line movements
5. Synchronizing records directly to Supabase PostgreSQL
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from supabase import create_client, Client

from config import settings
from math_engine import (
    BasketballPropModel,
    FootballMatchModel,
    calculate_edge_delta,
    calculate_edge_score,
    calculate_expected_value,
    calculate_kelly_units,
    calculate_parlay_metrics,
    decimal_to_american
)
from models import (
    CuratedParlay,
    Fixture,
    LineMovement,
    MarketType,
    ModelPrediction,
    ParlayLeg,
    PredictionStatus,
    Selection,
    Sport,
    Tier
)
from odds_fetcher import OddsFetcher

# Display names for the mobile client; kept in sync with supabase/seed_mock_data.sql's
# sports_leagues rows. Falls back to the raw league_id if a league isn't listed here.
LEAGUE_NAMES: Dict[str, str] = {
    "basketball_nba": "NBA",
    "basketball_euroleague": "EuroLeague",
    "basketball_cba": "Chinese Basketball Association (CBA)",
    "basketball_pba": "Philippine Basketball Association (PBA)",
    "basketball_nbl": "NBL Australia",
    "soccer_epl": "Premier League",
    "soccer_uefa_champs_league": "UEFA Champions League",
    "soccer_spain_la_liga": "La Liga",
}


def _match_title(fixture: Optional[Fixture], fixture_id: str, sport: Sport) -> str:
    if not fixture:
        return fixture_id
    if sport == Sport.BASKETBALL:
        return f"{fixture.away_team} @ {fixture.home_team}"
    return f"{fixture.home_team} vs {fixture.away_team}"


class PipelineOrchestrator:
    """
    Executes the analytical pipeline and keeps Supabase database synchronized.
    """

    def __init__(self):
        self.odds_fetcher = OddsFetcher(
            api_key=settings.THE_ODDS_API_KEY,
            mock_mode=settings.MOCK_MODE
        )
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except Exception as e:
                print(f"[Supabase] Could not initialize client: {e}")

        # In-memory storage for local caching & offline API serving
        self.cached_predictions: List[ModelPrediction] = []
        self.cached_parlays: List[CuratedParlay] = []
        self.cached_radar: List[LineMovement] = []
        self.cached_fixtures: List[Fixture] = []

    async def run_pipeline(self) -> Dict[str, Any]:
        """
        Executes a single end-to-end analytical cycle across all sports.
        """
        print(f"[{datetime.utcnow().isoformat()}] Starting EdgePoint+ Quantitative Run...")
        fixtures, raw_data = await self.odds_fetcher.fetch_fixtures_and_odds()
        self.cached_fixtures = fixtures
        fixture_map: Dict[str, Fixture] = {f.id: f for f in fixtures}

        predictions: List[ModelPrediction] = []
        radar_events: List[LineMovement] = []

        # 1. Process Basketball Props & Games
        for item in raw_data:
            fixture_id = item.get("fixture_id")
            sport = item.get("sport")
            fixture = fixture_map.get(fixture_id)

            if sport == Sport.BASKETBALL:
                props = item.get("props", [])
                for p in props:
                    pred, radar = self._process_basketball_prop(fixture_id, p, fixture)
                    if pred:
                        predictions.append(pred)
                    if radar:
                        radar_events.append(radar)

            elif sport == Sport.FOOTBALL:
                metrics = item.get("match_metrics", {})
                preds, radars = self._process_football_match(fixture_id, metrics, fixture)
                predictions.extend(preds)
                radar_events.extend(radars)

        # 2. Gate out picks that don't clear the configured EV / EdgeScore quality bar
        predictions = [
            p for p in predictions
            if p.ev_percentage >= settings.MIN_EV_PERCENTAGE and p.edge_score >= settings.MIN_EDGE_SCORE
        ]

        # 3. Sort predictions by EdgeScore descending
        predictions.sort(key=lambda x: x.edge_score, reverse=True)

        # 4. Gating: Top 1-2 qualify for free teaser tier, remaining high-value are pro tier
        for idx, pred in enumerate(predictions):
            if idx < settings.FREE_TIER_DAILY_PICKS:
                pred.tier = Tier.FREE
            else:
                pred.tier = Tier.PRO

        self.cached_predictions = predictions
        self.cached_radar = radar_events

        # 5. Construct PointBlank Daily Slip
        curated_parlay = self._build_pointblank_slip(predictions)
        if curated_parlay:
            self.cached_parlays = [curated_parlay]

        # 6. Push to Supabase if connected
        if self.supabase:
            await self._sync_to_supabase(fixtures, predictions, curated_parlay, radar_events)

        print(f"[{datetime.utcnow().isoformat()}] Pipeline Completed. Generated {len(predictions)} edges, {len(radar_events)} radar alerts.")
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "fixtures_count": len(fixtures),
            "predictions_count": len(predictions),
            "radar_events_count": len(radar_events),
            "parlay_generated": curated_parlay is not None
        }

    def _process_basketball_prop(
        self, fixture_id: str, prop: Dict[str, Any], fixture: Optional[Fixture] = None
    ) -> Tuple[Optional[ModelPrediction], Optional[LineMovement]]:
        """
        Projects basketball player prop lines, calculates EV and EdgeScore.
        """
        player = prop["player_name"]
        team = prop["team_name"]
        stat_type = prop["stat_type"]
        line = prop["line"]
        books: Dict[str, float] = prop["books"]

        # Calculate projected mean adjusted for pace & defense
        projected_mean = BasketballPropModel.calculate_projected_mean(
            l3_avg=prop["l3"],
            l5_avg=prop["l5"],
            l10_avg=prop["l10"],
            opponent_def_rank=prop["opp_def_rank"],
            projected_game_pace=prop["pace"],
            league_avg_pace=100.0,
            rest_days=1
        )

        prob_over, prob_under = BasketballPropModel.calculate_prop_probabilities(
            projected_mean=projected_mean,
            prop_line=line,
            stat_type=stat_type
        )

        # Pick the side with higher edge
        best_book = max(books, key=books.get)
        best_odds = books[best_book]

        # Assuming betting Over for high projected stats
        model_prob = prob_over if projected_mean > line else prob_under
        selection = Selection.OVER if projected_mean > line else Selection.UNDER

        # Fair odds from the model's own probability. Note: devig_power/devig_proportional
        # remove vig from a single book's two-sided market (e.g. Over/Under from one book);
        # `books` here holds one side's price across multiple books, so devigging it would
        # be meaningless. They're exercised once real two-sided odds are ingested per book.
        fair_odds = round(1.0 / model_prob, 3) if model_prob > 0 else 99.0

        ev_percent = calculate_expected_value(model_prob, best_odds)
        edge_delta = calculate_edge_delta(projected_mean, line)
        edge_score = calculate_edge_score(ev_percent, edge_delta, line)
        units = calculate_kelly_units(model_prob, best_odds, settings.KELLY_FRACTION, settings.MAX_RECOMMENDED_UNITS)

        # Map stat type to MarketType
        market_map = {
            "points": MarketType.PLAYER_POINTS,
            "rebounds": MarketType.PLAYER_REBOUNDS,
            "assists": MarketType.PLAYER_ASSISTS,
            "pra": MarketType.PRA_COMBO
        }

        league_id = fixture.league_id if fixture else "basketball_nba"
        pred = ModelPrediction(
            fixture_id=fixture_id,
            sport=Sport.BASKETBALL,
            league_id=league_id,
            league_name=LEAGUE_NAMES.get(league_id, league_id),
            match_title=_match_title(fixture, fixture_id, Sport.BASKETBALL),
            commence_time=fixture.commence_time if fixture else datetime.utcnow(),
            market_type=market_map.get(stat_type, MarketType.PLAYER_POINTS),
            player_name=player,
            team_name=team,
            selection=selection,
            line=line,
            best_bookmaker=best_book,
            sportsbook_odds=best_odds,
            american_odds=decimal_to_american(best_odds),
            implied_probability=round(1.0 / best_odds, 4),
            fair_odds=fair_odds,
            model_probability=model_prob,
            model_projected_stat=projected_mean,
            edge_delta=edge_delta,
            ev_percentage=ev_percent,
            edge_score=edge_score,
            recommended_units=units,
            tier=Tier.PRO,
            analysis_notes={
                "rolling_l3": prop["l3"],
                "rolling_l5": prop["l5"],
                "rolling_l10": prop["l10"],
                "opp_def_rank": prop["opp_def_rank"],
                "game_pace": prop["pace"]
            }
        )

        # Line movement / divergence check
        radar: Optional[LineMovement] = None
        if "Pinnacle" in books and best_book != "Pinnacle":
            pinnacle_odds = books["Pinnacle"]
            divergence = round(((best_odds - pinnacle_odds) / pinnacle_odds) * 100.0, 2)
            if divergence > 5.0:
                radar = LineMovement(
                    fixture_id=fixture_id,
                    sport=Sport.BASKETBALL,
                    match_title=_match_title(fixture, fixture_id, Sport.BASKETBALL),
                    market_key=f"player_{stat_type}",
                    selection=f"{player} {selection.value} {line}",
                    opening_odds=best_odds,
                    current_odds=best_odds,
                    sharp_book="Pinnacle",
                    divergent_book=best_book,
                    divergence_percentage=divergence,
                    alert_type="off_market_line"
                )

        return pred, radar

    def _process_football_match(
        self, fixture_id: str, metrics: Dict[str, Any], fixture: Optional[Fixture] = None
    ) -> Tuple[List[ModelPrediction], List[LineMovement]]:
        """
        Projects football match totals (Over/Under) and BTTS with Bivariate Poisson.
        """
        preds: List[ModelPrediction] = []
        radars: List[LineMovement] = []
        league_id = fixture.league_id if fixture else "soccer_epl"
        league_name = LEAGUE_NAMES.get(league_id, league_id)
        match_title = _match_title(fixture, fixture_id, Sport.FOOTBALL)
        commence_time = fixture.commence_time if fixture else datetime.utcnow()

        home_xg = metrics.get("home_xg", 1.5)
        away_xg = metrics.get("away_xg", 1.2)
        total_line = metrics.get("total_line", 2.5)
        books_total = metrics.get("books_total", {})
        books_btts = metrics.get("books_btts", {})

        probs = FootballMatchModel.calculate_match_probabilities(home_xg, away_xg, total_line)

        # 1. Total Goals Over/Under
        if books_total:
            best_book = max(books_total, key=books_total.get)
            best_odds = books_total[best_book]
            model_prob = probs["over_line"]
            ev_percent = calculate_expected_value(model_prob, best_odds)
            projected_total = round(home_xg + away_xg, 2)
            edge_delta = calculate_edge_delta(projected_total, total_line)
            edge_score = calculate_edge_score(ev_percent, edge_delta, total_line)
            units = calculate_kelly_units(model_prob, best_odds, settings.KELLY_FRACTION, settings.MAX_RECOMMENDED_UNITS)

            pred_total = ModelPrediction(
                fixture_id=fixture_id,
                sport=Sport.FOOTBALL,
                league_id=league_id,
                league_name=league_name,
                match_title=match_title,
                commence_time=commence_time,
                market_type=MarketType.MATCH_TOTAL,
                selection=Selection.OVER,
                line=total_line,
                best_bookmaker=best_book,
                sportsbook_odds=best_odds,
                american_odds=decimal_to_american(best_odds),
                implied_probability=round(1.0 / best_odds, 4),
                fair_odds=round(1.0 / model_prob, 3),
                model_probability=model_prob,
                model_projected_stat=projected_total,
                edge_delta=edge_delta,
                ev_percentage=ev_percent,
                edge_score=edge_score,
                recommended_units=units,
                tier=Tier.PRO,
                analysis_notes={
                    "home_xg": home_xg,
                    "away_xg": away_xg,
                    "poisson_over_prob": model_prob
                }
            )
            preds.append(pred_total)

        # 2. Both Teams To Score (BTTS)
        if books_btts:
            best_book = max(books_btts, key=books_btts.get)
            best_odds = books_btts[best_book]
            model_prob = probs["btts_yes"]
            ev_percent = calculate_expected_value(model_prob, best_odds)
            edge_score = calculate_edge_score(ev_percent)
            units = calculate_kelly_units(model_prob, best_odds, settings.KELLY_FRACTION, settings.MAX_RECOMMENDED_UNITS)

            pred_btts = ModelPrediction(
                fixture_id=fixture_id,
                sport=Sport.FOOTBALL,
                league_id=league_id,
                league_name=league_name,
                match_title=match_title,
                commence_time=commence_time,
                market_type=MarketType.BTTS,
                selection=Selection.YES,
                line=0.5,
                best_bookmaker=best_book,
                sportsbook_odds=best_odds,
                american_odds=decimal_to_american(best_odds),
                implied_probability=round(1.0 / best_odds, 4),
                fair_odds=round(1.0 / model_prob, 3),
                model_probability=model_prob,
                model_projected_stat=1.0,
                edge_delta=0.5,
                ev_percentage=ev_percent,
                edge_score=edge_score,
                recommended_units=units,
                tier=Tier.PRO,
                analysis_notes={
                    "btts_yes_prob": model_prob,
                    "home_xg": home_xg,
                    "away_xg": away_xg
                }
            )
            preds.append(pred_btts)

        return preds, radars

    def _build_pointblank_slip(self, predictions: List[ModelPrediction]) -> Optional[CuratedParlay]:
        """
        Selects the top 3 correlated positive EV legs across global slates.
        """
        if len(predictions) < 2:
            return None

        # Take up to 3 highest EdgeScore picks from distinct fixtures
        selected_legs: List[ModelPrediction] = []
        seen_fixtures = set()

        for p in predictions:
            if p.fixture_id not in seen_fixtures:
                selected_legs.append(p)
                seen_fixtures.add(p.fixture_id)
            if len(selected_legs) >= 3:
                break

        if len(selected_legs) < 2:
            return None

        # Build parlay legs
        parlay_legs: List[ParlayLeg] = []
        legs_data: List[Dict[str, float]] = []

        for p in selected_legs:
            leg_name = f"{p.player_name or ''} {p.selection.value} {p.line or ''}".strip()
            parlay_legs.append(
                ParlayLeg(
                    prediction_id=str(p.id),
                    fixture=p.fixture_id,
                    prop=leg_name,
                    selection=p.selection.value,
                    odds=p.sportsbook_odds,
                    ev=f"+{p.ev_percentage}%",
                    bookmaker=p.best_bookmaker
                )
            )
            legs_data.append({
                "odds": p.sportsbook_odds,
                "model_prob": p.model_probability
            })

        # Calculate combined metrics with slight cross-league correlation factor
        metrics = calculate_parlay_metrics(legs_data, correlation_factor=1.12)

        return CuratedParlay(
            title="PointBlank: Global Cross-League Slate",
            slate_date=datetime.utcnow().strftime("%Y-%m-%d"),
            legs=parlay_legs,
            total_sportsbook_odds=metrics["total_sportsbook_odds"],
            total_fair_odds=metrics["total_fair_odds"],
            model_win_probability=metrics["model_win_probability"],
            combined_ev_percentage=metrics["combined_ev_percentage"],
            correlation_score=metrics["correlation_score"],
            recommended_units=0.50,
            tier=Tier.PRO,
            status=PredictionStatus.PENDING,
            summary_analysis="Synergistic multi-sport parlay pairing high-possession basketball props with positive-xG football totals across staggered global time zones."
        )

    async def _sync_to_supabase(
        self,
        fixtures: List[Fixture],
        predictions: List[ModelPrediction],
        parlay: Optional[CuratedParlay],
        radar: List[LineMovement]
    ):
        """
        Upserts calculated datasets into Supabase PostgreSQL tables.
        The supabase-py client is synchronous, so the actual upserts run in a worker
        thread (asyncio.to_thread) rather than blocking the event loop -- otherwise a
        slow/unreachable Supabase endpoint would stall every concurrent FastAPI request.
        """
        if not self.supabase:
            return

        try:
            await asyncio.to_thread(self._sync_to_supabase_blocking, fixtures, predictions, parlay, radar)
            print("[Supabase] Successfully synchronized models to database.")
        except Exception as e:
            print(f"[Supabase] Sync error: {e}")

    def _sync_to_supabase_blocking(
        self,
        fixtures: List[Fixture],
        predictions: List[ModelPrediction],
        parlay: Optional[CuratedParlay],
        radar: List[LineMovement]
    ):
        # 1. Upsert Fixtures
        fixture_rows = [f.dict() for f in fixtures]
        for row in fixture_rows:
            row["commence_time"] = row["commence_time"].isoformat()
        self.supabase.table("fixtures").upsert(fixture_rows).execute()

        # 2. Upsert Predictions
        pred_rows = [p.dict() for p in predictions]
        for row in pred_rows:
            row["id"] = str(row["id"])
            row["created_at"] = row["created_at"].isoformat()
            row["commence_time"] = row["commence_time"].isoformat()
        self.supabase.table("model_predictions").upsert(pred_rows).execute()

        # 3. Upsert Parlay
        if parlay:
            parlay_dict = parlay.dict()
            parlay_dict["id"] = str(parlay_dict["id"])
            parlay_dict["created_at"] = parlay_dict["created_at"].isoformat()
            self.supabase.table("curated_parlays").upsert([parlay_dict]).execute()

        # 4. Upsert Line Movements
        if radar:
            radar_rows = [r.dict() for r in radar]
            for row in radar_rows:
                row["id"] = str(row["id"])
                row["created_at"] = row["created_at"].isoformat()
            self.supabase.table("line_movements").upsert(radar_rows).execute()
