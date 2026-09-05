"""
Tests for ml_pipeline/historical_match_feature_engineer.py.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_pipeline")))

from ml_pipeline.historical_match_feature_engineer import melt_matches_to_market_rows


def _one_match(**overrides):
    row = {
        "match_id": "m1",
        "match_date": pd.Timestamp("2020-01-01"),
        "season_start_year": 2020,
        "result": "H",
        "total_goals": 3,
        "avg_close_home": 1.9,
        "avg_close_draw": 3.6,
        "avg_close_away": 4.2,
        "avg_close_over25": 1.85,
        "avg_close_under25": 1.95,
        "home_goals_for_avg_l5": 1.8,
        "away_goals_for_avg_l5": 1.1,
        "home_goals_against_avg_l5": 1.0,
        "away_goals_against_avg_l5": 1.2,
    }
    row.update(overrides)
    return pd.DataFrame([row])


def test_melts_one_match_into_five_market_rows():
    result = melt_matches_to_market_rows(_one_match())
    assert len(result) == 5
    assert set(result["market"]) == {"Home Win", "Draw", "Away Win", "Over 2.5", "Under 2.5"}


def test_btts_is_never_a_market():
    result = melt_matches_to_market_rows(_one_match())
    assert "BTTS" not in set(result["market"])


def test_target_win_reflects_actual_result_and_total():
    # result="H", total_goals=3 (over 2.5): Home Win and Over 2.5 won; the rest lost.
    result = melt_matches_to_market_rows(_one_match())
    won_markets = set(result[result["target_win"] == 1]["market"])
    assert won_markets == {"Home Win", "Over 2.5"}


def test_under_market_correctly_classified_as_over_under():
    # This is the exact bug historical_data's sibling fix targeted: "Under"
    # must be classified is_over_under=1, same as "Over".
    result = melt_matches_to_market_rows(_one_match())
    under_row = result[result["market"] == "Under 2.5"].iloc[0]
    assert under_row["is_over_under"] == 1
    assert under_row["is_1x2"] == 0


def test_1x2_markets_correctly_classified():
    result = melt_matches_to_market_rows(_one_match())
    for market in ["Home Win", "Draw", "Away Win"]:
        row = result[result["market"] == market].iloc[0]
        assert row["is_1x2"] == 1
        assert row["is_over_under"] == 0


def test_implied_prob_is_inverse_of_odds():
    result = melt_matches_to_market_rows(_one_match())
    home_row = result[result["market"] == "Home Win"].iloc[0]
    assert home_row["implied_prob"] == pytest.approx(1.0 / 1.9)


def test_missing_market_odds_yields_fewer_rows_not_a_dropped_match():
    matches = _one_match(avg_close_draw=float("nan"))
    result = melt_matches_to_market_rows(matches)
    assert len(result) == 4
    assert "Draw" not in set(result["market"])


def test_rolling_form_columns_broadcast_to_every_melted_row():
    result = melt_matches_to_market_rows(_one_match())
    assert (result["home_goals_for_avg_l5"] == 1.8).all()
    assert (result["away_goals_against_avg_l5"] == 1.2).all()
