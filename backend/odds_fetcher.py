"""
EdgePoint+ Odds & Market Data Ingestion
Fetches live bookmaker lines from The Odds API / API-Sports or generates realistic
multi-league simulated slates (NBA, EuroLeague, CBA, PBA, NBL, EPL, UCL) in Mock Mode.
"""

from datetime import datetime, timedelta
import random
from typing import Any, Dict, List, Optional, Tuple
import httpx

from config import settings
from models import Fixture, OddsSnapshot, Outcome, Sport


class OddsFetcher:
    """
    Manages live data polling across sportsbooks (Pinnacle, Bet365, DraftKings, SportyBet, 1xBet).
    """

    BASE_ODDS_URL = "https://api.the-odds-api.com/v4/sports"

    def __init__(self, api_key: Optional[str] = None, mock_mode: bool = True):
        self.api_key = api_key or settings.THE_ODDS_API_KEY
        self.mock_mode = mock_mode if api_key else True

    async def fetch_fixtures_and_odds(self) -> Tuple[List[Fixture], List[Dict[str, Any]]]:
        """
        Main entrypoint: returns list of active fixtures and their associated odds boards.
        """
        if self.mock_mode or not self.api_key:
            return self._generate_mock_slate()

        # Real Odds API polling implementation
        fixtures: List[Fixture] = []
        odds_payloads: List[Dict[str, Any]] = []

        sports = [
            "basketball_nba",
            "basketball_euroleague",
            "soccer_epl",
            "soccer_uefa_champs_league"
        ]

        async with httpx.AsyncClient(timeout=10.0) as client:
            for sport_key in sports:
                try:
                    url = f"{self.BASE_ODDS_URL}/{sport_key}/odds/"
                    params = {
                        "apiKey": self.api_key,
                        "regions": "us,eu,uk",
                        "markets": "h2h,spreads,totals",
                        "oddsFormat": "decimal"
                    }
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        for event in data:
                            sport_type = Sport.BASKETBALL if "basketball" in sport_key else Sport.FOOTBALL
                            f = Fixture(
                                id=event["id"],
                                sport=sport_type,
                                league_id=sport_key,
                                home_team=event["home_team"],
                                away_team=event["away_team"],
                                commence_time=datetime.fromisoformat(event["commence_time"].replace("Z", "+00:00")),
                                status="scheduled"
                            )
                            fixtures.append(f)
                            odds_payloads.append(event)
                except Exception as e:
                    print(f"Error fetching live odds for {sport_key}: {e}")

        return fixtures, odds_payloads

    def _generate_mock_slate(self) -> Tuple[List[Fixture], List[Dict[str, Any]]]:
        """
        Generates realistic cross-league slates across global time zones:
        - CBA (Morning Asia)
        - EuroLeague (Afternoon Europe)
        - Premier League / UCL (Afternoon Europe)
        - NBA (Evening North America)
        """
        now = datetime.utcnow()
        fixtures: List[Fixture] = [
            # NBA
            Fixture(
                id="nba_lal_gsw",
                sport=Sport.BASKETBALL,
                league_id="basketball_nba",
                home_team="Los Angeles Lakers",
                away_team="Golden State Warriors",
                commence_time=now + timedelta(hours=4),
                venue="Crypto.com Arena"
            ),
            Fixture(
                id="nba_bos_mil",
                sport=Sport.BASKETBALL,
                league_id="basketball_nba",
                home_team="Boston Celtics",
                away_team="Milwaukee Bucks",
                commence_time=now + timedelta(hours=6),
                venue="TD Garden"
            ),
            # EuroLeague
            Fixture(
                id="euro_rma_bar",
                sport=Sport.BASKETBALL,
                league_id="basketball_euroleague",
                home_team="Real Madrid Baloncesto",
                away_team="FC Barcelona Basquet",
                commence_time=now + timedelta(hours=8),
                venue="WiZink Center"
            ),
            # CBA (Asia)
            Fixture(
                id="cba_gua_lia",
                sport=Sport.BASKETBALL,
                league_id="basketball_cba",
                home_team="Guangdong Southern Tigers",
                away_team="Liaoning Flying Leopards",
                commence_time=now + timedelta(hours=11),
                venue="Dongguan Basketball Center"
            ),
            # Football (EPL)
            Fixture(
                id="epl_ars_che",
                sport=Sport.FOOTBALL,
                league_id="soccer_epl",
                home_team="Arsenal",
                away_team="Chelsea",
                commence_time=now + timedelta(hours=5),
                venue="Emirates Stadium"
            ),
            Fixture(
                id="epl_mci_liv",
                sport=Sport.FOOTBALL,
                league_id="soccer_epl",
                home_team="Manchester City",
                away_team="Liverpool",
                commence_time=now + timedelta(hours=24),
                venue="Etihad Stadium"
            )
        ]

        mock_raw_data = [
            {
                "fixture_id": "nba_lal_gsw",
                "sport": Sport.BASKETBALL,
                "props": [
                    {
                        "player_name": "Stephen Curry",
                        "team_name": "Golden State Warriors",
                        "stat_type": "points",
                        "line": 26.5,
                        "books": {"DraftKings": 1.95, "Pinnacle": 1.88, "Bet365": 1.90},
                        "l3": 31.0, "l5": 29.4, "l10": 28.2,
                        "opp_def_rank": 22,
                        "pace": 102.5
                    },
                    {
                        "player_name": "LeBron James",
                        "team_name": "Los Angeles Lakers",
                        "stat_type": "assists",
                        "line": 7.5,
                        "books": {"DraftKings": 1.90, "Pinnacle": 1.82, "1xBet": 2.05},
                        "l3": 9.3, "l5": 8.6, "l10": 8.1,
                        "opp_def_rank": 19,
                        "pace": 102.5
                    }
                ]
            },
            {
                "fixture_id": "cba_gua_lia",
                "sport": Sport.BASKETBALL,
                "props": [
                    {
                        "player_name": "Tremont Waters",
                        "team_name": "Guangdong Southern Tigers",
                        "stat_type": "assists",
                        "line": 8.5,
                        "books": {"1xBet": 2.10, "Pinnacle": 1.89, "SportyBet": 2.02},
                        "l3": 11.3, "l5": 10.2, "l10": 9.6,
                        "opp_def_rank": 25,
                        "pace": 105.0
                    }
                ]
            },
            {
                "fixture_id": "nba_bos_mil",
                "sport": Sport.BASKETBALL,
                "props": [
                    {
                        "player_name": "Giannis Antetokounmpo",
                        "team_name": "Milwaukee Bucks",
                        "stat_type": "pra",
                        "line": 47.5,
                        "books": {"Pinnacle": 1.88, "DraftKings": 1.95, "Bet365": 1.91},
                        "l3": 54.0, "l5": 50.8, "l10": 49.1,
                        "opp_def_rank": 14,
                        "pace": 101.8
                    }
                ]
            },
            {
                "fixture_id": "epl_ars_che",
                "sport": Sport.FOOTBALL,
                "match_metrics": {
                    "home_xg": 1.95,
                    "away_xg": 1.35,
                    "total_line": 2.5,
                    "books_total": {"Bet365": 1.91, "Pinnacle": 1.85, "SportyBet": 1.93},
                    "books_btts": {"SportyBet": 1.75, "1xBet": 1.78, "Bet365": 1.72}
                }
            },
            {
                "fixture_id": "epl_mci_liv",
                "sport": Sport.FOOTBALL,
                "match_metrics": {
                    "home_xg": 2.10,
                    "away_xg": 1.65,
                    "total_line": 3.0,
                    "books_total": {"Pinnacle": 1.92, "Bet365": 1.95, "SportyBet": 1.90},
                    "books_btts": {"Bet365": 1.68, "SportyBet": 1.70, "Pinnacle": 1.65}
                }
            }
        ]

        return fixtures, mock_raw_data
