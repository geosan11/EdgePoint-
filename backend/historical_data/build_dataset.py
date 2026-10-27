"""
Assembles a training-ready historical match dataset: fetches season CSVs,
normalizes team names, computes point-in-time rolling form for both teams
of every match, and joins in the actual closing odds and outcome.

Usage:
    python -m historical_data.build_dataset --league E0 --start-season 1993 --end-season 2025
"""

import argparse
from pathlib import Path
from typing import Optional

import pandas as pd

from config import settings
from historical_data.fetcher import current_season_start_year, get_season_dataframe
from historical_data.rolling_features import rolling_form_for_matches
from historical_data.team_normalization import normalize_team_name


def _backend_root() -> Path:
    return Path(__file__).parent.parent


def fetch_all_seasons(league_code: str, start_season: int, end_season: int) -> pd.DataFrame:
    """Fetches and concatenates every season in [start_season, end_season].
    Only the detected current season is force-refreshed; completed past
    seasons are immutable once cached."""
    cache_dir = _backend_root() / settings.HISTORICAL_DATA_CACHE_DIR
    current_season = current_season_start_year()

    frames = []
    for start_year in range(start_season, end_season + 1):
        df = get_season_dataframe(
            league_code,
            start_year,
            cache_dir,
            force_refresh=(start_year == current_season),
        )
        frames.append(df)

    return pd.concat(frames, ignore_index=True)


def assemble_historical_dataset(raw_matches: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes team names, assigns a stable match_id, computes point-in-time
    rolling form for both teams, and appends the actual outcome. Rows
    missing the configured minimum rolling window for either team are
    dropped (never imputed) -- with an explicit printed count.
    """
    df = raw_matches.copy()
    df["home_team"] = df["home_team_raw"].map(normalize_team_name)
    df["away_team"] = df["away_team_raw"].map(normalize_team_name)
    df = df.sort_values("match_date").reset_index(drop=True)

    season_codes = df["season_start_year"].astype(str)
    df["match_id"] = (
        season_codes + "_"
        + df["match_date"].dt.strftime("%Y%m%d") + "_"
        + df["home_team"].str.replace(" ", "") + "_"
        + df["away_team"].str.replace(" ", "")
    )

    windows = tuple(int(w) for w in settings.HISTORICAL_ROLLING_WINDOWS.split(","))
    form = rolling_form_for_matches(df, windows=windows)
    merged = df.merge(form, on="match_id", how="left")

    merged["total_goals"] = merged["home_goals"] + merged["away_goals"]
    merged["btts"] = ((merged["home_goals"] > 0) & (merged["away_goals"] > 0)).astype(int)

    required_window = settings.HISTORICAL_MIN_ROLLING_WINDOW_REQUIRED
    required_col_home = f"home_matches_available"
    required_col_away = f"away_matches_available"
    total_matches = len(merged)
    keep_mask = (merged[required_col_home] >= required_window) & (merged[required_col_away] >= required_window)
    dropped_count = int((~keep_mask).sum())
    result = merged[keep_mask].reset_index(drop=True)

    print(
        f"[build_dataset] Total matches: {total_matches} | "
        f"Dropped (insufficient history, <{required_window} prior matches): {dropped_count} | "
        f"Final rows: {len(result)}"
    )

    return result


def build_dataset(
    league_code: str,
    start_season: int,
    end_season: Optional[int] = None,
) -> Path:
    end_season = end_season if end_season is not None else current_season_start_year()

    raw_matches = fetch_all_seasons(league_code, start_season, end_season)
    dataset = assemble_historical_dataset(raw_matches)

    output_dir = _backend_root() / settings.HISTORICAL_DATA_PROCESSED_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{league_code.lower()}_historical_matches.csv"
    dataset.to_csv(output_path, index=False)
    print(f"[build_dataset] Wrote {len(dataset)} rows to {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build a historical football match dataset")
    parser.add_argument("--league", default=settings.HISTORICAL_DATA_LEAGUES.split(",")[0])
    parser.add_argument("--start-season", type=int, default=settings.HISTORICAL_DATA_START_SEASON)
    parser.add_argument("--end-season", type=int, default=settings.HISTORICAL_DATA_END_SEASON)
    args = parser.parse_args()

    build_dataset(args.league, args.start_season, args.end_season)
