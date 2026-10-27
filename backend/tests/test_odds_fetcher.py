"""
Tests for odds_fetcher.py. The real-API branch is exercised with a fake
httpx.AsyncClient -- never a live network call.
"""

import sys
import os
import asyncio

import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from odds_fetcher import OddsFetcher
from models import Sport


def test_mock_mode_default_generates_mock_slate():
    fetcher = OddsFetcher()
    fixtures, raw_data = asyncio.run(fetcher.fetch_fixtures_and_odds())

    # Not every mock fixture has a matching raw odds/props entry (e.g. the
    # EuroLeague fixture currently has none) -- that's an existing, harmless
    # quirk of the mock slate, not something this test should assume away.
    assert len(fixtures) > 0
    assert len(raw_data) > 0
    assert len(raw_data) <= len(fixtures)


def test_mock_mode_forced_true_when_no_api_key_even_if_requested_false():
    # This is a real, easy-to-miss subtlety in __init__: mock_mode is forced
    # True whenever no api_key is available, regardless of what the caller
    # explicitly requested.
    fetcher = OddsFetcher(api_key=None, mock_mode=False)
    assert fetcher.mock_mode is True


def test_real_mode_when_api_key_and_mock_mode_false():
    fetcher = OddsFetcher(api_key="real-key", mock_mode=False)
    assert fetcher.mock_mode is False


def test_mock_slate_has_expected_known_fixtures():
    fetcher = OddsFetcher()
    fixtures, _ = fetcher._generate_mock_slate()

    fixture_ids = {f.id for f in fixtures}
    assert "nba_lal_gsw" in fixture_ids
    assert "epl_ars_che" in fixture_ids


def test_mock_slate_fixture_ids_stable_across_calls():
    fetcher = OddsFetcher()
    fixtures_a, _ = fetcher._generate_mock_slate()
    fixtures_b, _ = fetcher._generate_mock_slate()

    assert {f.id for f in fixtures_a} == {f.id for f in fixtures_b}


def test_mock_slate_basketball_and_football_both_present():
    fetcher = OddsFetcher()
    fixtures, _ = fetcher._generate_mock_slate()

    sports = {f.sport for f in fixtures}
    assert Sport.BASKETBALL in sports
    assert Sport.FOOTBALL in sports


class _FakeAsyncResponse:
    def __init__(self, status_code: int, json_data=None):
        self.status_code = status_code
        self._json_data = json_data or []

    def json(self):
        return self._json_data


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, url, params=None):
        raise NotImplementedError  # overridden per-test


def test_real_api_branch_parses_response_into_fixtures(monkeypatch):
    async def fake_get(self, url, params=None):
        if "basketball_nba" in url:
            return _FakeAsyncResponse(200, [{
                "id": "abc123",
                "home_team": "Los Angeles Lakers",
                "away_team": "Golden State Warriors",
                "commence_time": "2026-01-01T00:00:00Z",
            }])
        return _FakeAsyncResponse(200, [])

    _FakeAsyncClient.get = fake_get
    monkeypatch.setattr(httpx, "AsyncClient", _FakeAsyncClient)

    fetcher = OddsFetcher(api_key="real-key", mock_mode=False)
    fixtures, raw_data = asyncio.run(fetcher.fetch_fixtures_and_odds())

    nba_fixtures = [f for f in fixtures if f.id == "abc123"]
    assert len(nba_fixtures) == 1
    assert nba_fixtures[0].sport == Sport.BASKETBALL
    assert nba_fixtures[0].home_team == "Los Angeles Lakers"


def test_real_api_branch_continues_after_error_for_one_sport(monkeypatch):
    async def fake_get(self, url, params=None):
        if "basketball_nba" in url:
            raise httpx.ConnectError("simulated network failure")
        if "soccer_epl" in url:
            return _FakeAsyncResponse(200, [{
                "id": "epl1",
                "home_team": "Arsenal",
                "away_team": "Chelsea",
                "commence_time": "2026-01-01T00:00:00Z",
            }])
        return _FakeAsyncResponse(200, [])

    _FakeAsyncClient.get = fake_get
    monkeypatch.setattr(httpx, "AsyncClient", _FakeAsyncClient)

    fetcher = OddsFetcher(api_key="real-key", mock_mode=False)
    fixtures, raw_data = asyncio.run(fetcher.fetch_fixtures_and_odds())

    # One sport failing must not prevent fixtures from a working sport.
    assert any(f.id == "epl1" for f in fixtures)
