"""
Tests for historical_data/schema.py column normalization across eras.
"""

import sys
import os

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from historical_data.schema import normalize_columns, ALL_COLUMN_MAP, REQUIRED_MINIMUM_COLUMNS

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def test_normalizes_legacy_seven_column_file():
    raw = pd.read_csv(os.path.join(FIXTURES_DIR, "sample_epl_legacy_season.csv"))
    normalized = normalize_columns(raw)

    # Every canonical column must exist even though this era only has 7 raw columns.
    for canonical_name in ALL_COLUMN_MAP.values():
        assert canonical_name in normalized.columns

    assert normalized.loc[0, "home_team_raw"] == "Arsenal"
    assert normalized.loc[0, "home_goals"] == 0
    assert normalized.loc[0, "result"] == "A"
    # Odds/shots columns absent from this era must be NaN, not missing/absent.
    assert pd.isna(normalized.loc[0, "avg_close_home"])
    assert pd.isna(normalized.loc[0, "home_shots"])


def test_normalizes_modern_many_column_file():
    raw = pd.read_csv(os.path.join(FIXTURES_DIR, "sample_epl_modern_season.csv"))
    normalized = normalize_columns(raw)

    assert normalized.loc[0, "home_team_raw"] == "Man City"
    assert normalized.loc[0, "home_shots"] == 15
    assert normalized.loc[0, "avg_close_home"] == pytest.approx(1.35)
    assert normalized.loc[0, "avg_close_over25"] == pytest.approx(1.90)


def test_raises_when_required_column_missing():
    df = pd.DataFrame({"Date": ["14/08/93"], "HomeTeam": ["Arsenal"]})  # missing FTHG/FTAG/FTR/AwayTeam

    with pytest.raises(ValueError):
        normalize_columns(df)


def test_required_minimum_columns_always_present_after_normalization():
    raw = pd.read_csv(os.path.join(FIXTURES_DIR, "sample_epl_legacy_season.csv"))
    normalized = normalize_columns(raw)

    for col in REQUIRED_MINIMUM_COLUMNS:
        assert col in normalized.columns
        assert not normalized[col].isna().any()
