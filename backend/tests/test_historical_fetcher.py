"""
Tests for historical_data/fetcher.py. Never hits the live network -- every
test either exercises a pure function, uses tmp_path for caching, or injects
a fake httpx client. As a belt-and-suspenders guarantee, test_no_live_network_call
monkeypatches httpx.Client.get to raise if the cache-hit path ever calls it.
"""

import os
import sys
from datetime import date
from pathlib import Path

import httpx
import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from historical_data.fetcher import (
    current_season_start_year,
    fetch_season_csv,
    load_season_dataframe,
    season_csv_path,
    season_to_code,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


class _FakeResponse:
    def __init__(self, status_code: int, content: bytes = b"", headers: dict = None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {}

    def raise_for_status(self):
        if self.status_code >= 400 and self.status_code not in (429, 503):
            raise httpx.HTTPStatusError("error", request=None, response=self)


class _FakeClient:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def get(self, url):
        self.calls += 1
        return self._responses.pop(0)


def test_season_to_code():
    assert season_to_code(1993) == "9394"
    assert season_to_code(1999) == "9900"
    assert season_to_code(2023) == "2324"


def test_current_season_start_year_aug_to_dec():
    assert current_season_start_year(date(2026, 8, 15)) == 2026
    assert current_season_start_year(date(2026, 12, 31)) == 2026


def test_current_season_start_year_jan_to_jul():
    assert current_season_start_year(date(2026, 1, 1)) == 2025
    assert current_season_start_year(date(2026, 7, 31)) == 2025


def test_cache_hit_never_calls_network(tmp_path, monkeypatch):
    monkeypatch.setattr(
        httpx.Client, "get", lambda self, url: (_ for _ in ()).throw(AssertionError("network call made"))
    )

    dest = season_csv_path("E0", 2023, tmp_path)
    dest.parent.mkdir(parents=True)
    dest.write_text("Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR\n")

    result = fetch_season_csv("E0", 2023, tmp_path)
    assert result == dest


def test_cache_miss_downloads_and_writes_file(tmp_path, monkeypatch):
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake_client = _FakeClient([_FakeResponse(200, b"Div,Date\nE0,14/08/93\n")])

    result = fetch_season_csv("E0", 1993, tmp_path, client=fake_client, request_delay_seconds=0)

    assert result.exists()
    assert result.read_bytes() == b"Div,Date\nE0,14/08/93\n"
    assert fake_client.calls == 1


def test_retries_on_429_then_succeeds(tmp_path, monkeypatch):
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake_client = _FakeClient([_FakeResponse(429), _FakeResponse(200, b"ok")])

    result = fetch_season_csv("E0", 2023, tmp_path, client=fake_client, request_delay_seconds=0)

    assert result.read_bytes() == b"ok"
    assert fake_client.calls == 2


def test_raises_after_max_retries_on_persistent_429(tmp_path, monkeypatch):
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake_client = _FakeClient([_FakeResponse(429), _FakeResponse(429), _FakeResponse(429)])

    with pytest.raises(RuntimeError):
        fetch_season_csv("E0", 2023, tmp_path, client=fake_client, request_delay_seconds=0)


def test_retries_on_503_then_succeeds(tmp_path, monkeypatch):
    # Observed directly against the real host: throttling can also come back
    # as 503 "temporarily unavailable", not just 429.
    monkeypatch.setattr("time.sleep", lambda *_: None)
    fake_client = _FakeClient([_FakeResponse(503, headers={"retry-after": "1"}), _FakeResponse(200, b"ok")])

    result = fetch_season_csv("E0", 2023, tmp_path, client=fake_client, request_delay_seconds=0)

    assert result.read_bytes() == b"ok"


def test_honors_retry_after_header_instead_of_own_backoff(tmp_path, monkeypatch):
    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda seconds: sleep_calls.append(seconds))
    fake_client = _FakeClient([_FakeResponse(503, headers={"retry-after": "7"}), _FakeResponse(200, b"ok")])

    fetch_season_csv("E0", 2023, tmp_path, client=fake_client, request_delay_seconds=100)

    # The real Retry-After (7s) must be used for the retry wait, not the
    # much larger configured delay/backoff.
    assert 7.0 in sleep_calls


def test_retry_after_is_capped(tmp_path, monkeypatch):
    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda seconds: sleep_calls.append(seconds))
    fake_client = _FakeClient([_FakeResponse(503, headers={"retry-after": "99999"}), _FakeResponse(200, b"ok")])

    fetch_season_csv("E0", 2023, tmp_path, client=fake_client, request_delay_seconds=0)

    assert max(sleep_calls) <= 120.0


def test_load_season_dataframe_parses_legacy_two_digit_year():
    df = load_season_dataframe(Path(FIXTURES_DIR) / "sample_epl_legacy_season.csv", "E0", 1993)
    assert df.loc[0, "match_date"] == pd.Timestamp("1993-08-14")


def test_load_season_dataframe_parses_modern_four_digit_year():
    df = load_season_dataframe(Path(FIXTURES_DIR) / "sample_epl_modern_season.csv", "E0", 2023)
    assert df.loc[0, "match_date"] == pd.Timestamp("2023-08-11")


def test_load_season_dataframe_adds_league_and_season_columns():
    df = load_season_dataframe(Path(FIXTURES_DIR) / "sample_epl_legacy_season.csv", "E0", 1993)
    assert (df["league_code"] == "E0").all()
    assert (df["season_start_year"] == 1993).all()


def test_load_season_dataframe_cp1252_fallback(tmp_path):
    # Raw byte 0x92 decodes under cp1252 to a right-single-quote ('),
    # but is not a valid standalone UTF-8 byte -- this is the exact failure
    # mode load_season_dataframe must recover from for some older
    # football-data.co.uk files.
    csv_path = tmp_path / "cp1252_season.csv"
    header = b"Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR\n"
    row = b"E0,14/08/93,Nott" + b"\x92" + b"m Forest,Arsenal,1,1,D\n"
    csv_path.write_bytes(header + row)

    df = load_season_dataframe(csv_path, "E0", 1993)
    assert "Nott" in df.loc[0, "home_team_raw"]
