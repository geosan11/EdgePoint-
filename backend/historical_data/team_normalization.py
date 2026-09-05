"""
Team name normalization for football-data.co.uk data.

football-data.co.uk uses abbreviated/inconsistent team names (e.g. "Man
City", "Nott'm Forest" -- confirmed directly against real fetched data).
Normalization must be applied consistently to every occurrence of a team
across every season before any rolling-feature computation -- an unmapped
or inconsistently-mapped name silently creates a second "phantom" identity
with a fragmented, wrong match history.

TEAM_NAME_MAP below is seeded from mappings confirmed against real
football-data.co.uk rows. Run discover_unique_team_names() against the full
fetched dataset and extend this map from the actual output whenever a new
unmapped name shows up (a coverage test should assert zero unmapped names
against the real, fully-fetched dataset) -- never guess an abbreviation
without checking it against real data.
"""

import logging
from typing import Dict, List, Sequence

import pandas as pd

TEAM_NAME_MAP: Dict[str, str] = {
    "Man City": "Manchester City",
    "Man United": "Manchester United",
    "Nott'm Forest": "Nottingham Forest",
}


def normalize_team_name(raw_name: str) -> str:
    """Falls back to raw_name unchanged (with a logged warning) if unmapped
    -- never raises, since an unmapped name is a coverage gap to fix in
    TEAM_NAME_MAP, not a reason to crash the whole pipeline."""
    if raw_name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[raw_name]
    logging.warning(f"[team_normalization] Unmapped team name: {raw_name!r}")
    return raw_name


def discover_unique_team_names(dfs: Sequence[pd.DataFrame]) -> List[str]:
    """
    Returns sorted(set(home_team_raw) | set(away_team_raw)) across all given
    raw (post schema.normalize_columns, pre team-name-normalization) season
    DataFrames. Run this once against the real fetched history to build/
    extend TEAM_NAME_MAP from ground truth.
    """
    names = set()
    for df in dfs:
        names.update(df["home_team_raw"].dropna().unique())
        names.update(df["away_team_raw"].dropna().unique())
    return sorted(names)
