"""
Fetches and caches football-data.co.uk historical season CSVs.

This host rate-limits aggressively -- observed directly during development,
both as HTTP 429 and as HTTP 503 ("temporarily unavailable"), the latter
carrying an explicit Retry-After header (e.g. 86 seconds). Fetching is
therefore always sequential (never parallelized across seasons), with a
delay between requests and a bounded retry that honors Retry-After when the
server provides one rather than guessing our own backoff.

A completed past season's file is immutable once cached and should never
need force_refresh=True. The current in-progress season's file changes as
new matches are played -- callers should force-refresh only the season
returned by current_season_start_year().
"""

import time
from datetime import date
from pathlib import Path
from typing import Optional

import httpx
import pandas as pd

from config import settings
from historical_data.schema import normalize_columns

_MAX_RETRIES_ON_RATE_LIMIT = 3
_MAX_RETRY_AFTER_WAIT_SECONDS = 120.0


class _RateLimitedError(Exception):
    def __init__(self, status_code: int, retry_after_header: Optional[str]):
        self.status_code = status_code
        self.retry_after_header = retry_after_header
        super().__init__(f"Rate limited ({status_code}); Retry-After={retry_after_header!r}")


def _retry_wait_seconds(last_error: Optional[Exception], fallback: float) -> float:
    """Honors a server-provided Retry-After (seconds), capped, falling back
    to our own exponential backoff when the server didn't provide one."""
    if isinstance(last_error, _RateLimitedError) and last_error.retry_after_header:
        try:
            return min(float(last_error.retry_after_header), _MAX_RETRY_AFTER_WAIT_SECONDS)
        except ValueError:
            pass
    return fallback


def season_to_code(start_year: int) -> str:
    """1993 -> '9394', 1999 -> '9900', 2023 -> '2324'."""
    return f"{start_year % 100:02d}{(start_year + 1) % 100:02d}"


def current_season_start_year(today: Optional[date] = None) -> int:
    """EPL seasons start in August: Aug-Dec -> this year is the start year;
    Jan-Jul -> last year is the start year."""
    today = today or date.today()
    return today.year if today.month >= 8 else today.year - 1


def season_csv_path(league_code: str, start_year: int, cache_dir: Path) -> Path:
    return Path(cache_dir) / league_code / f"{season_to_code(start_year)}.csv"


def fetch_season_csv(
    league_code: str,
    start_year: int,
    cache_dir: Path,
    *,
    force_refresh: bool = False,
    client: Optional[httpx.Client] = None,
    request_delay_seconds: Optional[float] = None,
) -> Path:
    """
    Returns the local cached path, downloading only if missing or
    force_refresh. Sequential and throttled by design -- never call this in
    parallel across seasons/leagues.
    """
    dest = season_csv_path(league_code, start_year, cache_dir)
    if dest.exists() and not force_refresh:
        return dest

    dest.parent.mkdir(parents=True, exist_ok=True)
    delay = settings.HISTORICAL_DATA_REQUEST_DELAY_SECONDS if request_delay_seconds is None else request_delay_seconds
    url = f"{settings.FOOTBALL_DATA_CO_UK_BASE_URL}/{season_to_code(start_year)}/{league_code}.csv"

    owns_client = client is None
    active_client = client or httpx.Client(timeout=30.0)
    try:
        last_error: Optional[Exception] = None
        for attempt in range(_MAX_RETRIES_ON_RATE_LIMIT):
            if attempt > 0:
                time.sleep(_retry_wait_seconds(last_error, fallback=delay * (2 ** attempt)))
            try:
                response = active_client.get(url)
            except httpx.HTTPError as e:
                last_error = e
                continue

            if response.status_code in (429, 503):
                # Observed directly: this host returns 503 with an explicit
                # Retry-After header (not just 429) when throttling -- honor
                # it rather than guessing our own backoff.
                last_error = _RateLimitedError(response.status_code, response.headers.get("retry-after"))
                continue

            response.raise_for_status()
            dest.write_bytes(response.content)
            time.sleep(delay)
            return dest

        raise RuntimeError(f"Failed to fetch {url} after {_MAX_RETRIES_ON_RATE_LIMIT} attempts") from last_error
    finally:
        if owns_client:
            active_client.close()


def load_season_dataframe(csv_path: Path, league_code: str, start_year: int) -> pd.DataFrame:
    """
    Reads a cached season CSV and normalizes it to the canonical schema.
    Falls back to cp1252 on UnicodeDecodeError -- older football-data.co.uk
    files are not reliably utf-8. Drops fully-blank rows (trailing blank
    lines are common in these files) before normalizing.
    """
    try:
        raw = pd.read_csv(csv_path, encoding="utf-8")
    except UnicodeDecodeError:
        raw = pd.read_csv(csv_path, encoding="cp1252")

    raw = raw.dropna(how="all")
    normalized = normalize_columns(raw)
    normalized["match_date"] = pd.to_datetime(normalized["match_date"], dayfirst=True, format="mixed")
    normalized["league_code"] = league_code
    normalized["season_start_year"] = start_year
    return normalized.reset_index(drop=True)


def get_season_dataframe(
    league_code: str,
    start_year: int,
    cache_dir: Path,
    **fetch_kwargs,
) -> pd.DataFrame:
    """Convenience: fetch_season_csv() + load_season_dataframe() in one call."""
    csv_path = fetch_season_csv(league_code, start_year, cache_dir, **fetch_kwargs)
    return load_season_dataframe(csv_path, league_code, start_year)
