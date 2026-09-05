"""
Small synthetic end-to-end test of historical_data/build_dataset.py's
assembly logic (team normalization + match_id + rolling form join +
insufficient-history dropping), with hand-computed expected values.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import settings
from historical_data.build_dataset import assemble_historical_dataset

# Man City vs Team B, five meetings. With a required rolling window of 2:
# R1, R2 must be dropped (fewer than 2 prior matches for one or both teams);
# R3, R4, R5 must survive.
RAW_ROWS = [
    {"match_date": "2020-01-01", "home_team_raw": "Man City", "away_team_raw": "Team B", "home_goals": 2, "away_goals": 0, "season_start_year": 2020, "league_code": "E0"},
    {"match_date": "2020-01-08", "home_team_raw": "Team B", "away_team_raw": "Man City", "home_goals": 1, "away_goals": 1, "season_start_year": 2020, "league_code": "E0"},
    {"match_date": "2020-01-15", "home_team_raw": "Man City", "away_team_raw": "Team B", "home_goals": 0, "away_goals": 0, "season_start_year": 2020, "league_code": "E0"},
    {"match_date": "2020-01-22", "home_team_raw": "Team B", "away_team_raw": "Man City", "home_goals": 3, "away_goals": 1, "season_start_year": 2020, "league_code": "E0"},
    {"match_date": "2020-01-29", "home_team_raw": "Man City", "away_team_raw": "Team B", "home_goals": 1, "away_goals": 1, "season_start_year": 2020, "league_code": "E0"},
]


@pytest.fixture
def small_rolling_config(monkeypatch):
    monkeypatch.setattr(settings, "HISTORICAL_ROLLING_WINDOWS", "2")
    monkeypatch.setattr(settings, "HISTORICAL_MIN_ROLLING_WINDOW_REQUIRED", 2)


def _raw_matches():
    df = pd.DataFrame(RAW_ROWS)
    df["match_date"] = pd.to_datetime(df["match_date"])
    return df


def test_drops_rows_with_insufficient_history(small_rolling_config):
    result = assemble_historical_dataset(_raw_matches())
    # R1 (0 prior for both) and R2 (1 prior for both) are dropped; R3-R5 survive.
    assert len(result) == 3


def test_normalizes_team_names(small_rolling_config):
    result = assemble_historical_dataset(_raw_matches())
    assert "Manchester City" in set(result["home_team"]) | set(result["away_team"])
    assert "Man City" not in set(result["home_team"]) | set(result["away_team"])


def test_rolling_form_matches_hand_computed_value(small_rolling_config):
    result = assemble_historical_dataset(_raw_matches())

    # R3 (2020-01-15): Man City's prior goals_for are R1=2 (home), R2=1 (away) -> mean 1.5.
    # Team B's prior goals_for are R1=0 (away), R2=1 (home) -> mean 0.5.
    r3 = result[result["match_date"] == pd.Timestamp("2020-01-15")].iloc[0]
    assert r3["home_team"] == "Manchester City"
    assert r3["home_goals_for_avg_l2"] == pytest.approx(1.5)
    assert r3["away_goals_for_avg_l2"] == pytest.approx(0.5)


def test_derived_outcome_columns(small_rolling_config):
    result = assemble_historical_dataset(_raw_matches())
    r5 = result[result["match_date"] == pd.Timestamp("2020-01-29")].iloc[0]
    assert r5["total_goals"] == 2
    assert r5["btts"] == 1


def test_match_ids_are_unique(small_rolling_config):
    result = assemble_historical_dataset(_raw_matches())
    assert result["match_id"].is_unique
