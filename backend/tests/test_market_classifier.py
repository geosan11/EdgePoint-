"""
Tests for the shared market classifier used identically at ML training time
and inference time. The "Under" case here is the exact bug this module fixes:
inference used to only check for 'total'/'over', silently missing 'under'.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml_pipeline.market_classifier import classify_market


def test_over_under_markets():
    assert classify_market("Over 2.5") == (1, 0)
    assert classify_market("Under 2.5") == (1, 0)
    assert classify_market("Match Total Over 48.5") == (1, 0)


def test_1x2_markets():
    assert classify_market("Home Win") == (0, 1)
    assert classify_market("Draw") == (0, 1)
    assert classify_market("Away Win") == (0, 1)


def test_unrecognized_market_defaults_to_zero():
    assert classify_market("Both Teams To Score") == (0, 0)


def test_empty_or_none_input():
    assert classify_market("") == (0, 0)
    assert classify_market(None) == (0, 0)


def test_case_insensitive():
    assert classify_market("UNDER 2.5") == (1, 0)
    assert classify_market("home win") == (0, 1)
