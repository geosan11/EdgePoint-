"""
Tests for ml_pipeline/backtest_analytical_model.py.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_pipeline")))

from ml_pipeline.backtest_analytical_model import (
    PROXY_VARIANTS,
    backtest_analytical_model,
    compute_goal_expectancy_proxies,
    run_backtest,
    summarize_backtest,
)


def test_compute_goal_expectancy_proxies_plain_and_adjusted_hand_computed():
    df = pd.DataFrame({
        "home_goals_for_avg_l5": [2.0, 1.0],
        "away_goals_for_avg_l5": [1.0, 2.0],
        "home_goals_against_avg_l5": [1.0, 1.5],
        "away_goals_against_avg_l5": [1.5, 1.0],
        "home_goals": [2, 1],
        "away_goals": [1, 2],
        "season_start_year": [2020, 2020],
    })

    result = compute_goal_expectancy_proxies(df)

    # season_avg_goals for 2020 = mean([2, 1, 1, 2]) = 1.5
    assert result.loc[0, "home_goal_expectancy_proxy_plain"] == pytest.approx(2.0)
    assert result.loc[0, "away_goal_expectancy_proxy_plain"] == pytest.approx(1.0)
    assert result.loc[0, "home_goal_expectancy_proxy_adjusted"] == pytest.approx(2.0 * 1.5 / 1.5)
    assert result.loc[0, "away_goal_expectancy_proxy_adjusted"] == pytest.approx(1.0 * 1.0 / 1.5)


def test_no_column_or_key_is_ever_named_xg():
    # Everywhere in this module, the substitution for real xG must be named
    # "proxy", never "xg" -- so it can never be confused with real xG.
    df = pd.DataFrame({
        "home_goals_for_avg_l5": [1.5], "away_goals_for_avg_l5": [1.2],
        "home_goals_against_avg_l5": [1.0], "away_goals_against_avg_l5": [1.1],
        "home_goals": [2], "away_goals": [1], "season_start_year": [2020],
    })
    result = compute_goal_expectancy_proxies(df)
    assert not any("xg" in col.lower() for col in result.columns)


def test_summarize_backtest_brier_score_hand_computed():
    results_df = pd.DataFrame({
        "market_home_win": [0.6, 0.25],
        "model_home_win": [0.8, 0.3],
        "home_won": [1, 0],
        "closing_odds_home": [1.5, 4.0],
        "model_away_win": [0.1, 0.5],
        "away_won": [0, 1],
        "closing_odds_away": [8.0, 2.0],
        "market_over": [0.5, 0.5],
        "model_over": [0.55, 0.45],
        "closing_odds_over": [2.0, 2.0],
        "over_occurred": [1, 0],
        "btts": [1, 0],
        "model_btts_yes": [0.6, 0.4],
    })

    summary = summarize_backtest(results_df)

    # Brier = mean((prob - outcome)^2): (0.8-1)^2=0.04, (0.3-0)^2=0.09 -> mean 0.065
    assert summary["home_win_brier"] == pytest.approx(0.065)
    # (0.6-1)^2=0.16, (0.4-0)^2=0.16 -> mean 0.16
    assert summary["btts_brier"] == pytest.approx(0.16)


def test_btts_has_no_roi_key_only_calibration():
    results_df = pd.DataFrame({"btts": [1, 0], "model_btts_yes": [0.6, 0.4]})
    summary = summarize_backtest(results_df)

    assert "btts_brier" in summary
    assert "btts_note" in summary
    assert "btts_roi" not in summary
    assert "no bttS odds" in summary["btts_note"].lower() or "no btts odds" in summary["btts_note"].lower()


def test_backtest_analytical_model_end_to_end_with_synthetic_matches():
    df = pd.DataFrame({
        "match_id": ["m1", "m2"],
        "result": ["H", "A"],
        "total_goals": [3, 1],
        "btts": [1, 0],
        "home_goals": [2, 0],
        "away_goals": [1, 1],
        "season_start_year": [2020, 2020],
        "home_goals_for_avg_l5": [1.8, 1.0],
        "away_goals_for_avg_l5": [1.1, 1.3],
        "home_goals_against_avg_l5": [1.0, 1.2],
        "away_goals_against_avg_l5": [1.2, 1.0],
        "avg_close_home": [1.9, 3.5],
        "avg_close_draw": [3.6, 3.3],
        "avg_close_away": [4.2, 2.0],
        "avg_close_over25": [1.85, 2.1],
        "avg_close_under25": [1.95, 1.75],
    })
    enriched = compute_goal_expectancy_proxies(df)

    result = backtest_analytical_model(enriched, proxy_variant="plain")

    assert len(result) == 2
    assert set(["model_home_win", "market_home_win", "model_over", "market_over"]).issubset(result.columns)
    assert not any("xg" in col.lower() for col in result.columns)
    # Probabilities must be valid probabilities.
    for col in ["model_home_win", "model_draw", "model_away_win", "model_over", "model_under"]:
        assert (result[col] >= 0).all() and (result[col] <= 1).all()


def test_run_backtest_reports_both_proxy_variants():
    df = pd.DataFrame({
        "match_id": ["m1"],
        "result": ["H"],
        "total_goals": [3],
        "btts": [1],
        "home_goals": [2],
        "away_goals": [1],
        "season_start_year": [2020],
        "home_goals_for_avg_l5": [1.8],
        "away_goals_for_avg_l5": [1.1],
        "home_goals_against_avg_l5": [1.0],
        "away_goals_against_avg_l5": [1.2],
        "avg_close_home": [1.9],
        "avg_close_draw": [3.6],
        "avg_close_away": [4.2],
        "avg_close_over25": [1.85],
        "avg_close_under25": [1.95],
    })

    results = run_backtest(df)

    assert set(results.keys()) == set(PROXY_VARIANTS)
    for variant_summary in results.values():
        assert "home_win_brier" in variant_summary
