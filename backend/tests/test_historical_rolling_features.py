"""
Leakage-safety tests for historical_data/rolling_features.py.

This is the single most important test file in the historical data pipeline:
a bug here means every backtest and every model trained on this data is
silently invalid, because it would have been shown the answer before being
asked the question. Distinctive "plant" values (e.g. 99, -50) are used
throughout so a leak produces an obviously wrong number, not a coincidentally
correct one.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from historical_data.rolling_features import (
    build_team_match_log,
    rolling_form_as_of,
    rolling_form_for_matches,
)


def _matches(rows):
    """rows: list of dicts with match_id, match_date (str), home_team,
    away_team, home_goals, away_goals. match_date is parsed to Timestamp."""
    df = pd.DataFrame(rows)
    df["match_date"] = pd.to_datetime(df["match_date"])
    return df


# Team A's history: three real matches, then the match being featurized
# (M4, dated 2020-01-22) carries a "planted" implausible goals_for of 99.
# If a bug leaked M4 into its own pre-match form, the l3 average would jump
# far away from the correct value -- this is deliberate, not a coincidence.
BASE_ROWS = [
    {"match_id": "M1", "match_date": "2020-01-01", "home_team": "A", "away_team": "Z", "home_goals": 1, "away_goals": 0},
    {"match_id": "M2", "match_date": "2020-01-08", "home_team": "Z", "away_team": "A", "home_goals": 5, "away_goals": 2},
    {"match_id": "M3", "match_date": "2020-01-15", "home_team": "A", "away_team": "Y", "home_goals": 3, "away_goals": 1},
    {"match_id": "M4", "match_date": "2020-01-22", "home_team": "A", "away_team": "X", "home_goals": 99, "away_goals": 0},
]


def test_excludes_match_on_as_of_date_itself():
    matches = _matches(BASE_ROWS)
    log = build_team_match_log(matches)

    # As of M4's own date: prior matches are M1 (1), M2 (2), M3 (3) only.
    # A buggy implementation that fails to exclude the as-of-date's own match
    # would pull in the planted 99 and produce a wildly different average.
    result = rolling_form_as_of(log, "A", as_of_date="2020-01-22", windows=(3,), stat_columns=("goals_for",))

    assert result["matches_available"] == 3
    assert result["goals_for_avg_l3"] == pytest.approx((1 + 2 + 3) / 3)


def test_excludes_matches_strictly_after_as_of_date():
    rows = BASE_ROWS[:3] + [
        # A future match relative to M3's date, with another implausible
        # planted value -- must never affect form computed as of M3.
        {"match_id": "M_future", "match_date": "2020-02-01", "home_team": "A", "away_team": "W", "home_goals": -50, "away_goals": 0},
    ]
    matches = _matches(rows)
    log = build_team_match_log(matches)

    result = rolling_form_as_of(log, "A", as_of_date="2020-01-15", windows=(2,), stat_columns=("goals_for",))

    # Prior to M3 (2020-01-15): only M1 (1), M2 (2).
    assert result["matches_available"] == 2
    assert result["goals_for_avg_l2"] == pytest.approx((1 + 2) / 2)


def test_returns_none_when_insufficient_history():
    matches = _matches(BASE_ROWS[:3])  # A has exactly 2 prior matches before M3
    log = build_team_match_log(matches)

    result = rolling_form_as_of(log, "A", as_of_date="2020-01-15", windows=(2, 5), stat_columns=("goals_for",))

    assert result["matches_available"] == 2
    assert result["goals_for_avg_l2"] == pytest.approx((1 + 2) / 2)
    assert result["goals_for_avg_l5"] is None  # never a fabricated/imputed value


def test_combines_home_and_away_matches():
    # A's goals_for come from a home appearance (M1: 1) and an away
    # appearance (M2: 2) -- both must be counted, not just one venue.
    matches = _matches(BASE_ROWS[:3])
    log = build_team_match_log(matches)

    result = rolling_form_as_of(log, "A", as_of_date="2020-01-15", windows=(2,), stat_columns=("goals_for",))

    assert result["goals_for_avg_l2"] == pytest.approx((1 + 2) / 2)


def test_uses_actual_match_date_not_row_order():
    matches = _matches(BASE_ROWS)
    shuffled = matches.sample(frac=1, random_state=7).reset_index(drop=True)

    log_ordered = build_team_match_log(matches)
    log_shuffled = build_team_match_log(shuffled)

    result_ordered = rolling_form_as_of(log_ordered, "A", as_of_date="2020-01-22", windows=(3,), stat_columns=("goals_for",))
    result_shuffled = rolling_form_as_of(log_shuffled, "A", as_of_date="2020-01-22", windows=(3,), stat_columns=("goals_for",))

    assert result_shuffled == result_ordered


def test_build_team_match_log_produces_symmetric_home_away_rows():
    matches = _matches([
        {"match_id": "M1", "match_date": "2020-01-01", "home_team": "A", "away_team": "B", "home_goals": 3, "away_goals": 1},
    ])
    log = build_team_match_log(matches)

    home_row = log[log["team"] == "A"].iloc[0]
    away_row = log[log["team"] == "B"].iloc[0]

    assert home_row["goals_for"] == away_row["goals_against"] == 3
    assert away_row["goals_for"] == home_row["goals_against"] == 1


def test_multiple_windows_in_one_call_match_single_window_calls():
    matches = _matches(BASE_ROWS)
    log = build_team_match_log(matches)

    combined = rolling_form_as_of(log, "A", as_of_date="2020-01-22", windows=(3, 2), stat_columns=("goals_for",))
    single_l3 = rolling_form_as_of(log, "A", as_of_date="2020-01-22", windows=(3,), stat_columns=("goals_for",))
    single_l2 = rolling_form_as_of(log, "A", as_of_date="2020-01-22", windows=(2,), stat_columns=("goals_for",))

    assert combined["goals_for_avg_l3"] == single_l3["goals_for_avg_l3"]
    assert combined["goals_for_avg_l2"] == single_l2["goals_for_avg_l2"]


def test_rolling_form_for_matches_batch_matches_direct_calls():
    matches = _matches(BASE_ROWS)

    batch = rolling_form_for_matches(matches, windows=(3,), stat_columns=("goals_for",))
    m4_row = batch[batch["match_id"] == "M4"].iloc[0]

    log = build_team_match_log(matches)
    direct = rolling_form_as_of(log, "A", as_of_date="2020-01-22", windows=(3,), stat_columns=("goals_for",))

    assert m4_row["home_goals_for_avg_l3"] == pytest.approx(direct["goals_for_avg_l3"])
