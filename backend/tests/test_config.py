"""
Tests for config.py's Settings: defaults, env-var overrides, and validation
bounds on the safety-critical ML blend settings.
"""

import sys
import os

import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import Settings


def test_mock_mode_defaults_true():
    # Production safety default: never call paid external APIs unconfigured.
    assert Settings().MOCK_MODE is True


def test_ml_blend_disabled_by_default():
    # Must stay off by default -- an unvalidated model must never silently
    # affect real predictions. See math_engine.py's adjust_probability_with_ml.
    assert Settings().ML_BLEND_ENABLED is False


def test_ml_blend_weight_default_favors_heuristic():
    assert Settings().ML_BLEND_WEIGHT == 0.3


def test_ml_blend_weight_rejects_out_of_range_values():
    with pytest.raises(ValidationError):
        Settings(ML_BLEND_WEIGHT=1.5)
    with pytest.raises(ValidationError):
        Settings(ML_BLEND_WEIGHT=-0.1)


def test_kelly_fraction_default():
    assert Settings().KELLY_FRACTION == 0.25


def test_free_tier_daily_picks_default():
    assert Settings().FREE_TIER_DAILY_PICKS == 2


def test_env_var_overrides_default(monkeypatch):
    monkeypatch.setenv("MOCK_MODE", "False")
    monkeypatch.setenv("MIN_EV_PERCENTAGE", "7.5")

    settings = Settings()

    assert settings.MOCK_MODE is False
    assert settings.MIN_EV_PERCENTAGE == 7.5


def test_internal_api_key_unset_by_default():
    assert Settings().INTERNAL_API_KEY is None


def test_historical_data_settings_defaults():
    settings = Settings()
    assert settings.HISTORICAL_DATA_LEAGUES == "E0"
    assert settings.HISTORICAL_DATA_START_SEASON == 1993
    assert settings.HISTORICAL_DATA_END_SEASON is None
    assert settings.HISTORICAL_MIN_ROLLING_WINDOW_REQUIRED == 5
