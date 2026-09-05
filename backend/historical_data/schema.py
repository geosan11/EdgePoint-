"""
Column normalization for football-data.co.uk season CSVs.

Column sets differ wildly by era -- confirmed directly against the real
site: the 1993-94 EPL file has only 7 columns (Div,Date,HomeTeam,AwayTeam,
FTHG,FTAG,FTR), while the 2023-24 file has ~100 columns including
shots/corners/cards and pre-match + closing odds from ~15 bookmakers.
normalize_columns() maps every present raw column to a stable canonical
name and fills any canonical column absent from this era's file with NaN,
so every season DataFrame exposes an identical shape downstream regardless
of source era.
"""

from typing import Dict, List

import pandas as pd

CORE_COLUMNS: Dict[str, str] = {
    "Date": "match_date",
    "HomeTeam": "home_team_raw",
    "AwayTeam": "away_team_raw",
    "FTHG": "home_goals",
    "FTAG": "away_goals",
    "FTR": "result",
    "HS": "home_shots",
    "AS": "away_shots",
    "HST": "home_shots_on_target",
    "AST": "away_shots_on_target",
    "HC": "home_corners",
    "AC": "away_corners",
    "HY": "home_yellow_cards",
    "AY": "away_yellow_cards",
    "HR": "home_red_cards",
    "AR": "away_red_cards",
}

# No BTTS odds columns exist anywhere in this data source (confirmed by
# inspecting real headers) -- there is deliberately no BTTS entry here.
CLOSING_ODDS_COLUMNS: Dict[str, str] = {
    "AvgCH": "avg_close_home",
    "AvgCD": "avg_close_draw",
    "AvgCA": "avg_close_away",
    "AvgC>2.5": "avg_close_over25",
    "AvgC<2.5": "avg_close_under25",
    "B365CH": "b365_close_home",
    "B365CD": "b365_close_draw",
    "B365CA": "b365_close_away",
    "PSCH": "ps_close_home",
    "PSCD": "ps_close_draw",
    "PSCA": "ps_close_away",
}

ALL_COLUMN_MAP: Dict[str, str] = {**CORE_COLUMNS, **CLOSING_ODDS_COLUMNS}

REQUIRED_MINIMUM_COLUMNS: List[str] = [
    "match_date",
    "home_team_raw",
    "away_team_raw",
    "home_goals",
    "away_goals",
    "result",
]


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Renames every present raw column per ALL_COLUMN_MAP. Any canonical
    column not present in this era's file is added filled with NaN -- after
    checking for required columns, so an optional-column gap (expected) is
    never confused with a required-column gap (should never happen for a
    genuine football-data.co.uk EPL file, and raises ValueError if it does).
    """
    rename_map = {raw: canon for raw, canon in ALL_COLUMN_MAP.items() if raw in df.columns}
    normalized = df.rename(columns=rename_map)

    missing_required = [c for c in REQUIRED_MINIMUM_COLUMNS if c not in normalized.columns]
    if missing_required:
        raise ValueError(f"Normalized DataFrame is missing required columns: {missing_required}")

    for canonical_name in ALL_COLUMN_MAP.values():
        if canonical_name not in normalized.columns:
            normalized[canonical_name] = pd.NA

    return normalized
