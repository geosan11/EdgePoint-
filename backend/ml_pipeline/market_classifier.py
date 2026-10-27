"""
Shared market-type classification for the ML pipeline.

Used identically at training time (football_feature_engineer.py) and
inference time (math_engine.py). Keeping this logic in exactly one place
prevents the two from silently drifting apart -- e.g. training flagging
"Under 2.5" as an over/under market while inference does not, which would
have the model scoring live bets against the wrong learned bucket.
"""

from typing import Tuple


def classify_market(market_type: str) -> Tuple[int, int]:
    """Returns (is_over_under, is_1x2) flags for a market/selection string."""
    text = (market_type or "").lower()
    is_over_under = 1 if ("over" in text or "under" in text or "total" in text) else 0
    is_1x2 = 1 if ("win" in text or "draw" in text) else 0
    return is_over_under, is_1x2
