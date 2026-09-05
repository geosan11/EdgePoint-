"""
Point-in-time pre-match rolling form features.

This module is the correctness foundation of the whole historical data
pipeline. A team's pre-match "form" for a match on date X must be computed
from ONLY that team's matches strictly before X -- never the match itself,
never anything after it. A leak here silently invalidates every backtest and
every model trained on this data, since the model would effectively be shown
the answer before being asked the question.

Deliberately implemented as one simple, obviously-correct filter+sort+tail
rather than a vectorized `groupby().rolling().shift()`. That idiom is exactly
the kind of off-by-one that leaks a match's own result into its own
"pre-match" feature -- the one failure mode this module exists to prevent.
"""

from typing import Dict, List, Optional, Sequence

import pandas as pd

DEFAULT_STAT_COLUMNS: Sequence[str] = (
    "goals_for",
    "goals_against",
    "shots_for",
    "shots_against",
    "corners_for",
    "corners_against",
)

REQUIRED_MATCH_COLUMNS: Sequence[str] = (
    "match_id",
    "match_date",
    "home_team",
    "away_team",
    "home_goals",
    "away_goals",
)

_OPTIONAL_STAT_SOURCE_COLUMNS: Sequence[str] = (
    "home_shots",
    "away_shots",
    "home_corners",
    "away_corners",
)


def build_team_match_log(matches_df: pd.DataFrame) -> pd.DataFrame:
    """
    Reshapes one-row-per-match into two rows per match (one per team), each
    carrying that team's own for/against stats. This is a pure reshape --
    it never fills or fabricates a missing stat; an absent column (e.g. no
    shots data for a 1990s season) simply carries through as NaN.

    Required input columns: match_id, match_date, home_team, away_team,
    home_goals, away_goals. Optional (NaN-filled if absent): home_shots,
    away_shots, home_corners, away_corners.
    """
    missing = [c for c in REQUIRED_MATCH_COLUMNS if c not in matches_df.columns]
    if missing:
        raise ValueError(f"matches_df is missing required columns: {missing}")

    df = matches_df.copy()
    for col in _OPTIONAL_STAT_SOURCE_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    home_rows = pd.DataFrame({
        "match_id": df["match_id"],
        "match_date": df["match_date"],
        "team": df["home_team"],
        "is_home": True,
        "goals_for": df["home_goals"],
        "goals_against": df["away_goals"],
        "shots_for": df["home_shots"],
        "shots_against": df["away_shots"],
        "corners_for": df["home_corners"],
        "corners_against": df["away_corners"],
    })
    away_rows = pd.DataFrame({
        "match_id": df["match_id"],
        "match_date": df["match_date"],
        "team": df["away_team"],
        "is_home": False,
        "goals_for": df["away_goals"],
        "goals_against": df["home_goals"],
        "shots_for": df["away_shots"],
        "shots_against": df["home_shots"],
        "corners_for": df["away_corners"],
        "corners_against": df["home_corners"],
    })

    return pd.concat([home_rows, away_rows], ignore_index=True)


def rolling_form_as_of(
    team_match_log: pd.DataFrame,
    team: str,
    as_of_date,
    windows: Sequence[int] = (3, 5, 10),
    stat_columns: Sequence[str] = DEFAULT_STAT_COLUMNS,
) -> Dict[str, Optional[float]]:
    """
    Returns rolling form for `team` as of `as_of_date`, using ONLY that
    team's matches (home and away combined) with match_date STRICTLY BEFORE
    as_of_date. A match dated exactly as_of_date -- including the match
    being featurized itself -- is excluded; callers pass that match's own
    date and this function's job is the exclusion, not the caller's.

    Filters/sorts by the actual match_date column, never by row order --
    postponed and rearranged fixtures are common, so input row order cannot
    be trusted as chronological order.

    Returns one dict covering ALL requested windows in one pass, e.g.:
        {"matches_available": 7,
         "goals_for_avg_l3": 1.67, "goals_for_avg_l5": 1.4, "goals_for_avg_l10": None, ...}
    A window's stats are None (never a fabricated/imputed value) whenever
    fewer than that many prior matches exist for the team.
    """
    as_of_date = pd.Timestamp(as_of_date)

    prior = (
        team_match_log[
            (team_match_log["team"] == team) & (team_match_log["match_date"] < as_of_date)
        ]
        .sort_values("match_date")
    )

    result: Dict[str, Optional[float]] = {"matches_available": int(len(prior))}
    for window in windows:
        if len(prior) < window:
            for stat in stat_columns:
                result[f"{stat}_avg_l{window}"] = None
            continue
        recent = prior.tail(window)
        for stat in stat_columns:
            value = recent[stat].mean()
            result[f"{stat}_avg_l{window}"] = float(value) if pd.notna(value) else None
    return result


def rolling_form_for_matches(
    matches_df: pd.DataFrame,
    windows: Sequence[int] = (3, 5, 10),
    stat_columns: Sequence[str] = DEFAULT_STAT_COLUMNS,
) -> pd.DataFrame:
    """
    Convenience batch entrypoint: builds the team match log once, then
    computes home_*/away_* prefixed rolling form for every match in
    matches_df, returned as one row per match_id aligned with matches_df's
    index. Intended for build_dataset.py; rolling_form_as_of is the unit of
    correctness and is what tests target directly.
    """
    team_match_log = build_team_match_log(matches_df)

    records: List[Dict[str, Optional[float]]] = []
    for row in matches_df.itertuples(index=False):
        home_form = rolling_form_as_of(team_match_log, row.home_team, row.match_date, windows, stat_columns)
        away_form = rolling_form_as_of(team_match_log, row.away_team, row.match_date, windows, stat_columns)
        record: Dict[str, Optional[float]] = {"match_id": row.match_id}
        record.update({f"home_{k}": v for k, v in home_form.items()})
        record.update({f"away_{k}": v for k, v in away_form.items()})
        records.append(record)

    return pd.DataFrame.from_records(records)
