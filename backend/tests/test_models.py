"""
Tests for models.py's pydantic domain schemas: field validation and default
factories.
"""

import sys
import os
from datetime import datetime

import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import CuratedParlay, Fixture, MarketType, ModelPrediction, Selection, Sport, Tier


def _minimal_prediction(**overrides) -> dict:
    fields = dict(
        fixture_id="f1",
        sport=Sport.BASKETBALL,
        league_id="basketball_nba",
        match_title="A @ B",
        commence_time=datetime.utcnow(),
        market_type=MarketType.PLAYER_POINTS,
        selection=Selection.OVER,
        best_bookmaker="DraftKings",
        sportsbook_odds=1.9,
        implied_probability=0.526,
        fair_odds=1.8,
        model_probability=0.55,
        ev_percentage=5.0,
        edge_score=80.0,
    )
    fields.update(overrides)
    return fields


def test_model_prediction_minimal_construction():
    pred = ModelPrediction(**_minimal_prediction())
    assert pred.tier == Tier.PRO  # default
    assert pred.recommended_units == 1.0  # default


def test_edge_score_rejects_out_of_range_values():
    with pytest.raises(ValidationError):
        ModelPrediction(**_minimal_prediction(edge_score=150.0))
    with pytest.raises(ValidationError):
        ModelPrediction(**_minimal_prediction(edge_score=-1.0))


def test_edge_score_boundary_values_are_valid():
    ModelPrediction(**_minimal_prediction(edge_score=0.0))
    ModelPrediction(**_minimal_prediction(edge_score=100.0))


def test_model_prediction_ids_are_unique_by_default():
    pred_a = ModelPrediction(**_minimal_prediction())
    pred_b = ModelPrediction(**_minimal_prediction())
    assert pred_a.id != pred_b.id


def test_model_prediction_created_at_auto_populates():
    pred = ModelPrediction(**_minimal_prediction())
    assert isinstance(pred.created_at, datetime)


def test_sport_enum_rejects_invalid_value():
    with pytest.raises(ValidationError):
        ModelPrediction(**_minimal_prediction(sport="tennis"))


def test_fixture_minimal_construction_defaults():
    fixture = Fixture(
        id="f1", sport=Sport.FOOTBALL, league_id="soccer_epl",
        home_team="Arsenal", away_team="Chelsea", commence_time=datetime.utcnow(),
    )
    assert fixture.status == "scheduled"
    assert fixture.home_score is None


def test_curated_parlay_default_title_and_tier():
    parlay = CuratedParlay(
        slate_date="2026-01-01", legs=[], total_sportsbook_odds=2.0, total_fair_odds=1.8,
        model_win_probability=0.5, combined_ev_percentage=10.0, correlation_score=1.0,
    )
    assert parlay.title == "The Daily PointBlank Slip"
    assert parlay.tier == Tier.PRO
