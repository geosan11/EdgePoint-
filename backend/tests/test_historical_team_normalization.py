"""
Tests for historical_data/team_normalization.py.
"""

import sys
import os

import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from historical_data.team_normalization import (
    discover_unique_team_names,
    normalize_team_name,
)


def test_confirmed_real_mappings():
    # These two mappings were confirmed directly against real
    # football-data.co.uk rows during development -- not guessed.
    assert normalize_team_name("Man City") == "Manchester City"
    assert normalize_team_name("Nott'm Forest") == "Nottingham Forest"


def test_unmapped_name_falls_back_unchanged():
    assert normalize_team_name("Some Unmapped FC") == "Some Unmapped FC"


def test_discover_unique_team_names_across_seasons():
    df1 = pd.DataFrame({"home_team_raw": ["Man City", "Arsenal"], "away_team_raw": ["Arsenal", "Man City"]})
    df2 = pd.DataFrame({"home_team_raw": ["Chelsea"], "away_team_raw": ["Man City"]})

    names = discover_unique_team_names([df1, df2])

    assert names == sorted({"Man City", "Arsenal", "Chelsea"})


def test_round_robin_invariant_after_normalization():
    # In a completed round-robin, every team appears as both HomeTeam and
    # AwayTeam. Normalization must not break that symmetry.
    matches = pd.DataFrame({
        "home_team_raw": ["Man City", "Nott'm Forest", "Arsenal", "Chelsea"],
        "away_team_raw": ["Arsenal", "Chelsea", "Nott'm Forest", "Man City"],
    })

    home_teams = set(matches["home_team_raw"].map(normalize_team_name))
    away_teams = set(matches["away_team_raw"].map(normalize_team_name))

    assert home_teams == away_teams
