"""
Pinned known-gap tests: document current, intentionally-deferred limitations
rather than fixing them, so a future pass touching this code path sees them
explicitly instead of the gap being silently forgotten.
"""

import sys
import os
import asyncio
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from supabase_sync import PipelineOrchestrator
from models import Fixture, Sport


def test_real_mode_raw_payload_shape_produces_zero_predictions():
    """
    PINNED KNOWN GAP: odds_fetcher.py's real-API branch returns raw
    Odds-API event payloads (id/sport_key/home_team/away_team/bookmakers) --
    it never adds the "fixture_id"/"sport"/"props"/"match_metrics" keys that
    run_pipeline()'s dispatch loop requires to route data into
    _process_basketball_prop/_process_football_match. So real (non-mock)
    mode silently produces ZERO predictions today, with no error anywhere.

    This test feeds exactly that real-shaped raw payload through
    run_pipeline() and asserts the (currently correct, but undesirable)
    empty result -- so the gap stays visible and must be consciously
    addressed, not silently forgotten, the moment a future pass does the
    live-wiring. This is NOT a bug to fix as part of this test suite.
    """
    orchestrator = PipelineOrchestrator()

    real_shaped_raw_event = {
        "id": "abc123",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2026-01-01T00:00:00Z",
        "home_team": "Los Angeles Lakers",
        "away_team": "Golden State Warriors",
        "bookmakers": [],
    }
    fixture = Fixture(
        id="abc123", sport=Sport.BASKETBALL, league_id="basketball_nba",
        home_team="Los Angeles Lakers", away_team="Golden State Warriors",
        commence_time=datetime.utcnow(),
    )

    async def fake_fetch():
        return [fixture], [real_shaped_raw_event]

    orchestrator.odds_fetcher.fetch_fixtures_and_odds = fake_fetch

    summary = asyncio.run(orchestrator.run_pipeline())

    assert summary["fixtures_count"] == 1
    assert summary["predictions_count"] == 0
