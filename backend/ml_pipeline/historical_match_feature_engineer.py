"""
Melts one-row-per-match historical data into one-row-per-(market,selection)
training rows with real closing odds -- the shape train.py's feature
contract expects (implied_prob/is_over_under/is_1x2 per bet), now fed by
real match outcomes and real market prices instead of personal bet history.

Reuses market_classifier.classify_market() so this can never compute
market-type flags differently than football_feature_engineer.py or
math_engine.py already do.

BTTS is deliberately excluded: no closing odds exist for it anywhere in the
football-data.co.uk source, so there is no real odds value to derive
implied_prob from.
"""

import sys
from pathlib import Path
from typing import Sequence

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from market_classifier import classify_market

ROLLING_FORM_COLUMNS: Sequence[str] = (
    "home_goals_for_avg_l5",
    "away_goals_for_avg_l5",
    "home_goals_against_avg_l5",
    "away_goals_against_avg_l5",
)

# (market label, closing-odds column, win-condition over a match row)
_MARKETS = [
    ("Home Win", "avg_close_home", lambda row: row["result"] == "H"),
    ("Draw", "avg_close_draw", lambda row: row["result"] == "D"),
    ("Away Win", "avg_close_away", lambda row: row["result"] == "A"),
    ("Over 2.5", "avg_close_over25", lambda row: row["total_goals"] > 2.5),
    ("Under 2.5", "avg_close_under25", lambda row: row["total_goals"] < 2.5),
]


def melt_matches_to_market_rows(matches_df: pd.DataFrame) -> pd.DataFrame:
    """
    One output row per (match, market) where that market's closing odds are
    present -- a match missing one market's odds simply yields fewer rows
    for that match, not a dropped match.
    """
    records = []
    for _, row in matches_df.iterrows():
        for market_label, odds_col, won_fn in _MARKETS:
            odds = row.get(odds_col)
            if pd.isna(odds):
                continue

            is_over_under, is_1x2 = classify_market(market_label)
            record = {
                "match_id": row["match_id"],
                "market": market_label,
                "odds": odds,
                "implied_prob": 1.0 / odds,
                "is_over_under": is_over_under,
                "is_1x2": is_1x2,
                "target_win": int(won_fn(row)),
                "match_date": row["match_date"],
                "season_start_year": row["season_start_year"],
            }
            for col in ROLLING_FORM_COLUMNS:
                record[col] = row.get(col)
            records.append(record)

    return pd.DataFrame.from_records(records)
