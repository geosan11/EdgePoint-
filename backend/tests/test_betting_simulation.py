"""
Tests for ml_pipeline/betting_simulation.py.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml_pipeline.betting_simulation import format_caution_message, simulate_flat_bet_roi


def test_filters_to_positive_ev_only():
    # Row 0: model_prob=0.6, odds=2.0 -> ev = 0.2 (qualifies, > 0.02)
    # Row 1: model_prob=0.4, odds=2.0 -> ev = -0.2 (does not qualify)
    model_prob = pd.Series([0.6, 0.4])
    odds = pd.Series([2.0, 2.0])
    won = pd.Series([1, 1])

    result = simulate_flat_bet_roi(model_prob, odds, won)

    assert result["total_bets"] == 1
    assert result["total_available"] == 2


def test_roi_and_win_rate_hand_computed():
    # Both qualify (ev=0.2 each); one wins (profit = odds-1 = 1.0), one loses (profit = -1.0).
    model_prob = pd.Series([0.6, 0.6])
    odds = pd.Series([2.0, 2.0])
    won = pd.Series([1, 0])

    result = simulate_flat_bet_roi(model_prob, odds, won)

    assert result["total_bets"] == 2
    assert result["win_rate"] == pytest.approx(0.5)
    assert result["total_profit"] == pytest.approx(0.0)  # +1.0 - 1.0
    assert result["roi"] == pytest.approx(0.0)


def test_no_qualifying_bets_returns_none_roi_not_zero():
    model_prob = pd.Series([0.4, 0.3])
    odds = pd.Series([2.0, 2.0])
    won = pd.Series([0, 0])

    result = simulate_flat_bet_roi(model_prob, odds, won)

    assert result["total_bets"] == 0
    assert result["roi"] is None  # never fabricate a 0.0 ROI from zero bets
    assert result["below_minimum_sample"] is True


def test_below_minimum_sample_flag():
    model_prob = pd.Series([0.6] * 5)
    odds = pd.Series([2.0] * 5)
    won = pd.Series([1, 0, 1, 0, 1])

    result = simulate_flat_bet_roi(model_prob, odds, won, min_meaningful_bets=30)

    assert result["total_bets"] == 5
    assert result["below_minimum_sample"] is True


def test_at_or_above_minimum_sample_not_flagged():
    model_prob = pd.Series([0.6] * 30)
    odds = pd.Series([2.0] * 30)
    won = pd.Series([1, 0] * 15)

    result = simulate_flat_bet_roi(model_prob, odds, won, min_meaningful_bets=30)

    assert result["below_minimum_sample"] is False


def test_caution_message_mentions_bet_count():
    result = {"total_bets": 5}
    message = format_caution_message(result, min_meaningful_bets=30)
    assert "5" in message
    assert "30" in message
