"""
EdgePoint+ Pipeline Orchestrator Unit Tests
Guards against regressions in league_id resolution and EV/EdgeScore gating.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import Fixture, Sport
from supabase_sync import PipelineOrchestrator


@pytest.fixture
def orchestrator():
    return PipelineOrchestrator()


CURRY_PROP = {
    "player_name": "Stephen Curry",
    "team_name": "Golden State Warriors",
    "stat_type": "points",
    "line": 26.5,
    "books": {"DraftKings": 1.95, "Pinnacle": 1.88, "Bet365": 1.90},
    "l3": 31.0, "l5": 29.4, "l10": 28.2,
    "opp_def_rank": 22,
    "pace": 102.5,
}

MATCH_METRICS = {
    "home_xg": 1.95,
    "away_xg": 1.35,
    "total_line": 2.5,
    "books_total": {"Bet365": 1.91, "Pinnacle": 1.85, "SportyBet": 1.93},
    "books_btts": {"SportyBet": 1.75, "1xBet": 1.78, "Bet365": 1.72},
}


def _fixture(league_id: str, sport: Sport) -> Fixture:
    return Fixture(
        id="fx_1",
        sport=sport,
        league_id=league_id,
        home_team="Home",
        away_team="Away",
        commence_time=datetime.utcnow() + timedelta(hours=4),
    )


def test_basketball_prop_uses_fixtures_own_league_id(orchestrator):
    fixture = _fixture("basketball_euroleague", Sport.BASKETBALL)
    pred, _ = orchestrator._process_basketball_prop("euro_rma_bar", CURRY_PROP, fixture)
    assert pred.league_id == "basketball_euroleague"


def test_basketball_prop_falls_back_without_fixture(orchestrator):
    pred, _ = orchestrator._process_basketball_prop("unknown_fixture", CURRY_PROP, None)
    assert pred.league_id == "basketball_nba"


def test_football_match_uses_fixtures_own_league_id(orchestrator):
    fixture = _fixture("soccer_uefa_champs_league", Sport.FOOTBALL)
    preds, _ = orchestrator._process_football_match("fix_ucl_rm_bay", MATCH_METRICS, fixture)
    assert all(p.league_id == "soccer_uefa_champs_league" for p in preds)


def test_football_match_falls_back_without_fixture(orchestrator):
    preds, _ = orchestrator._process_football_match("unknown_fixture", MATCH_METRICS, None)
    assert all(p.league_id == "soccer_epl" for p in preds)


def test_positive_ev_prediction_never_gets_zero_recommended_units(orchestrator):
    """
    calculate_kelly_units returns 0.0 for non-positive edge (see math_engine fix).
    Since edge_score/ev_percentage and kelly's sign are derived from the same
    probability edge, any prediction that clears MIN_EV_PERCENTAGE must also
    receive a nonzero recommended stake -- otherwise a "qualified" pick would
    render with a 0u stake in the app.
    """
    fixture = _fixture("basketball_nba", Sport.BASKETBALL)
    pred, _ = orchestrator._process_basketball_prop("nba_lal_gsw", CURRY_PROP, fixture)
    assert pred.ev_percentage > 0
    assert pred.recommended_units > 0.0


def test_run_pipeline_only_returns_predictions_clearing_the_quality_bar():
    from config import settings

    orchestrator = PipelineOrchestrator()
    asyncio.run(orchestrator.run_pipeline())

    assert len(orchestrator.cached_predictions) > 0
    for pred in orchestrator.cached_predictions:
        assert pred.ev_percentage >= settings.MIN_EV_PERCENTAGE
        assert pred.edge_score >= settings.MIN_EDGE_SCORE
