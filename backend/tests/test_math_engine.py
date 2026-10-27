"""
EdgePoint+ Quantitative Engine Unit Tests
Validates mathematical integrity, probability distributions, devigging models, and EdgeScore formulations.
"""

import sys
import os
import pytest

# Add parent backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import math_engine
from config import settings
from math_engine import (
    american_to_decimal,
    decimal_to_american,
    calculate_implied_probability,
    devig_proportional,
    devig_power,
    BasketballPropModel,
    FootballMatchModel,
    calculate_expected_value,
    calculate_edge_delta,
    calculate_edge_score,
    calculate_kelly_units,
    calculate_parlay_metrics
)


def test_odds_conversions():
    # Decimal to American
    assert decimal_to_american(2.00) == 100
    assert decimal_to_american(1.91) == -110
    assert decimal_to_american(2.50) == 150
    assert decimal_to_american(1.50) == -200

    # American to Decimal
    assert american_to_decimal(100) == 2.0
    assert american_to_decimal(-110) == 1.909
    assert american_to_decimal(150) == 2.5
    assert american_to_decimal(-200) == 1.5


def test_implied_probability():
    assert calculate_implied_probability(2.00) == 0.50
    assert calculate_implied_probability(1.50) == 0.6667
    assert calculate_implied_probability(4.00) == 0.25


def test_devigging():
    # 2-way market with standard 4.76% vig: -110 / -110 (1.909 / 1.909)
    odds = [1.909, 1.909]
    fair_probs = devig_proportional(odds)
    assert len(fair_probs) == 2
    assert pytest.approx(sum(fair_probs), abs=1e-3) == 1.0
    assert pytest.approx(fair_probs[0], abs=1e-2) == 0.50

    # Power devigging on asymmetric odds
    asym_odds = [1.30, 3.80]
    power_probs = devig_power(asym_odds)
    assert len(power_probs) == 2
    assert pytest.approx(sum(power_probs), abs=1e-3) == 1.0
    assert power_probs[0] > power_probs[1]


def test_basketball_prop_projection():
    # Test Stephen Curry points projection
    projected = BasketballPropModel.calculate_projected_mean(
        l3_avg=31.0,
        l5_avg=29.0,
        l10_avg=28.0,
        opponent_def_rank=25,  # Weak defense -> boost
        projected_game_pace=102.0,
        league_avg_pace=100.0,
        rest_days=1
    )
    # Baseline = 0.5*31 + 0.3*29 + 0.2*28 = 15.5 + 8.7 + 5.6 = 29.8
    # Defense rank 25 -> 0.90 + (24/29)*0.20 = 1.0655
    # Pace -> 1.02
    # Expected > 29.8
    assert projected > 29.8

    prob_over, prob_under = BasketballPropModel.calculate_prop_probabilities(
        projected_mean=projected,
        prop_line=26.5,
        stat_type="points"
    )
    assert prob_over + prob_under == pytest.approx(1.0, abs=1e-3)
    assert prob_over > 0.50  # Since projected > line, Over must be favored


def test_football_poisson_model():
    # Arsenal vs Chelsea: High xG match (home 2.0, away 1.4)
    probs = FootballMatchModel.calculate_match_probabilities(home_xg=2.0, away_xg=1.4, total_line=2.5)

    assert "over_line" in probs
    assert "btts_yes" in probs
    assert probs["over_line"] + probs["under_line"] == pytest.approx(1.0, abs=1e-3)
    assert probs["btts_yes"] + probs["btts_no"] == pytest.approx(1.0, abs=1e-3)

    # In a 3.4 combined xG match, Over 2.5 should have > 60% probability
    assert probs["over_line"] > 0.60
    assert probs["btts_yes"] > 0.60


def test_edgescore_and_delta():
    # +10% EV with positive delta
    ev = 10.0
    delta = 3.5
    line = 24.5
    score = calculate_edge_score(ev_percentage=ev, edge_delta=delta, line=line)

    assert 0.0 <= score <= 100.0
    # Base 50 + (10 * 2 = 20) + delta component should push score well above 70
    assert score >= 70.0

    # Negative EV should depress EdgeScore below 50
    neg_score = calculate_edge_score(ev_percentage=-8.0, edge_delta=-2.0, line=24.5)
    assert neg_score < 50.0


def test_fractional_kelly():
    # Win probability 65% with odds 2.2 -> Strong edge, clearly above the 0.5u floor
    units = calculate_kelly_units(model_probability=0.65, sportsbook_odds=2.2, fraction=0.25)
    assert 0.5 <= units <= 3.0
    assert units > 0.5  # Should recommend above minimal floor

    # No edge at all (model agrees exactly with the market-implied probability) -> no stake
    no_edge_units = calculate_kelly_units(model_probability=0.50, sportsbook_odds=2.0, fraction=0.25)
    assert no_edge_units == 0.0

    # Negative edge -> no stake, not the floored minimum
    neg_edge_units = calculate_kelly_units(model_probability=0.40, sportsbook_odds=2.0, fraction=0.25)
    assert neg_edge_units == 0.0


def test_parlay_metrics():
    legs = [
        {"odds": 2.00, "model_prob": 0.58},
        {"odds": 1.90, "model_prob": 0.55}
    ]
    parlay = calculate_parlay_metrics(legs, correlation_factor=1.10)
    assert parlay["total_sportsbook_odds"] == pytest.approx(3.80, abs=1e-2)
    assert parlay["correlation_score"] == 1.10
    assert parlay["combined_ev_percentage"] > 0


def test_ml_blend_disabled_by_default_returns_base_prob(monkeypatch):
    # Off by default: an unvalidated model must never silently affect real predictions.
    monkeypatch.setattr(settings, "ML_BLEND_ENABLED", False)
    result = FootballMatchModel.adjust_probability_with_ml(
        market_type="Over 2.5", sportsbook_odds=1.90, base_prob=0.55
    )
    assert result == 0.55


def test_ml_blend_enabled_without_model_returns_base_prob(monkeypatch):
    monkeypatch.setattr(settings, "ML_BLEND_ENABLED", True)
    monkeypatch.setattr(math_engine, "get_ml_model", lambda name="football_xgb_v1.joblib": None)
    result = FootballMatchModel.adjust_probability_with_ml(
        market_type="Over 2.5", sportsbook_odds=1.90, base_prob=0.55
    )
    assert result == 0.55


def test_ml_blend_uses_configured_weight_and_classifies_under_correctly(monkeypatch):
    class FakeModel:
        def predict_proba(self, features):
            # This is the exact bug case: an "Under" market must still be
            # classified is_over_under=1, matching how training data is labeled.
            assert features.iloc[0]["is_over_under"] == 1
            assert features.iloc[0]["is_1x2"] == 0
            return [[0.2, 0.8]]  # ml_prob = 0.8

    monkeypatch.setattr(settings, "ML_BLEND_ENABLED", True)
    monkeypatch.setattr(settings, "ML_BLEND_WEIGHT", 0.3)
    monkeypatch.setattr(math_engine, "get_ml_model", lambda name="football_xgb_v1.joblib": FakeModel())

    result = FootballMatchModel.adjust_probability_with_ml(
        market_type="Under 2.5", sportsbook_odds=1.90, base_prob=0.50
    )
    expected = (0.3 * 0.8) + (0.7 * 0.50)
    assert result == pytest.approx(expected, abs=1e-6)
