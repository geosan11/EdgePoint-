"""
Tests for main.py's FastAPI endpoints, using TestClient against the real app
(MOCK_MODE, no real network/Supabase). Filtering/gating tests set
main.orchestrator's cached_* attributes directly with controlled fixture
data (rather than depending on the mock pipeline's exact current output),
so they stay stable regardless of unrelated changes to the mock slate.
"""

import sys
import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import main
from config import settings
from models import CuratedParlay, LineMovement, ModelPrediction, MarketType, Selection, Sport, Tier


def _prediction(sport=Sport.BASKETBALL, tier=Tier.FREE, edge_score=80.0) -> ModelPrediction:
    return ModelPrediction(
        fixture_id="f1",
        sport=sport,
        league_id="basketball_nba",
        match_title="Team A @ Team B",
        commence_time=datetime.utcnow() + timedelta(hours=2),
        market_type=MarketType.PLAYER_POINTS,
        selection=Selection.OVER,
        best_bookmaker="DraftKings",
        sportsbook_odds=1.9,
        implied_probability=0.526,
        fair_odds=1.8,
        model_probability=0.55,
        ev_percentage=5.0,
        edge_score=edge_score,
        tier=tier,
    )


@pytest.fixture
def client():
    return TestClient(main.app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "online"
    assert body["mock_mode"] == settings.MOCK_MODE


def test_predictions_filters_by_sport(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", None)
    main.orchestrator.cached_predictions = [
        _prediction(sport=Sport.BASKETBALL),
        _prediction(sport=Sport.FOOTBALL),
    ]

    response = client.get("/api/predictions", params={"sport": "basketball"})

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["sport"] == "basketball"


def test_predictions_filters_by_min_edge_score(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", None)
    main.orchestrator.cached_predictions = [
        _prediction(edge_score=60.0),
        _prediction(edge_score=90.0),
    ]

    response = client.get("/api/predictions", params={"min_edge_score": 75.0})

    results = response.json()
    assert len(results) == 1
    assert results[0]["edge_score"] == 90.0


def test_predictions_pro_gating_hides_pro_tier_without_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "secret-key")
    main.orchestrator.cached_predictions = [
        _prediction(tier=Tier.FREE),
        _prediction(tier=Tier.PRO),
    ]

    response = client.get("/api/predictions")

    results = response.json()
    assert len(results) == 1
    assert results[0]["tier"] == "free"


def test_predictions_pro_gating_shows_all_with_correct_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "secret-key")
    main.orchestrator.cached_predictions = [
        _prediction(tier=Tier.FREE),
        _prediction(tier=Tier.PRO),
    ]

    response = client.get("/api/predictions", headers={"X-API-Key": "secret-key"})

    results = response.json()
    assert len(results) == 2


def test_predictions_open_when_internal_api_key_unset(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", None)
    main.orchestrator.cached_predictions = [_prediction(tier=Tier.PRO)]

    response = client.get("/api/predictions")

    assert len(response.json()) == 1


def test_daily_parlay_gated_without_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "secret-key")
    main.orchestrator.cached_parlays = [
        CuratedParlay(
            slate_date="2026-01-01", legs=[], total_sportsbook_odds=2.0, total_fair_odds=1.8,
            model_win_probability=0.5, combined_ev_percentage=10.0, correlation_score=1.0,
        )
    ]

    response = client.get("/api/parlay/daily")

    assert response.json() is None


def test_daily_parlay_visible_with_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "secret-key")
    main.orchestrator.cached_parlays = [
        CuratedParlay(
            slate_date="2026-01-01", legs=[], total_sportsbook_odds=2.0, total_fair_odds=1.8,
            model_win_probability=0.5, combined_ev_percentage=10.0, correlation_score=1.0,
        )
    ]

    response = client.get("/api/parlay/daily", headers={"X-API-Key": "secret-key"})

    assert response.json() is not None
    assert response.json()["total_sportsbook_odds"] == 2.0


def test_radar_endpoint_returns_cached_events(client):
    main.orchestrator.cached_radar = [
        LineMovement(
            fixture_id="f1", sport=Sport.FOOTBALL, match_title="A vs B", market_key="h2h",
            selection="Home", opening_odds=2.0, current_odds=1.8, divergent_book="Bet365",
            divergence_percentage=5.0, alert_type="steam_move",
        )
    ]

    response = client.get("/api/radar")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_run_pipeline_endpoint_returns_summary(client):
    response = client.post("/api/run-pipeline")

    assert response.status_code == 200
    body = response.json()
    assert "summary" in body
    for key in ["fixtures_count", "predictions_count", "radar_events_count", "parlay_generated"]:
        assert key in body["summary"]


def test_lifespan_startup_populates_predictions_in_mock_mode():
    # The one test exercising the real lifespan startup path end-to-end.
    with TestClient(main.app) as lifecycle_client:
        response = lifecycle_client.get("/api/predictions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
