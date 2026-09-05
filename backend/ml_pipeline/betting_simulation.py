"""
Shared betting-simulation logic: filter to +EV bets, simulate flat-unit
staking, and flag when the resulting sample is too small to be meaningful.

Extracted from train.py so this definition can never drift between the
personal-bet-history trainer and the historical-data backtest -- the same
discipline market_classifier.py already established for market-type flags.
"""

from typing import Any, Dict

import numpy as np
import pandas as pd

DEFAULT_EV_THRESHOLD = 0.02
DEFAULT_MIN_MEANINGFUL_BETS = 30


def simulate_flat_bet_roi(
    model_probability: pd.Series,
    decimal_odds: pd.Series,
    won: pd.Series,
    ev_threshold: float = DEFAULT_EV_THRESHOLD,
    min_meaningful_bets: int = DEFAULT_MIN_MEANINGFUL_BETS,
) -> Dict[str, Any]:
    """
    Filters to rows implying +EV > ev_threshold (model_probability * decimal_odds - 1),
    simulates flat 1-unit staking on those rows, and returns bet count, win
    rate, total profit, ROI, and a below_minimum_sample flag -- never a bare
    number with no indication of how much (or little) it should be trusted.
    """
    ev = (model_probability * decimal_odds) - 1.0
    mask = ev > ev_threshold
    total_available = len(model_probability)
    total_bets = int(mask.sum())

    if total_bets == 0:
        return {
            "total_bets": 0,
            "total_available": total_available,
            "win_rate": None,
            "total_profit": 0.0,
            "roi": None,
            "below_minimum_sample": True,
        }

    bet_won = won[mask]
    bet_odds = decimal_odds[mask]
    profit = np.where(bet_won == 1, bet_odds - 1.0, -1.0)

    total_profit = float(profit.sum())
    roi = total_profit / total_bets

    return {
        "total_bets": total_bets,
        "total_available": total_available,
        "win_rate": float(bet_won.mean()),
        "total_profit": total_profit,
        "roi": roi,
        "below_minimum_sample": total_bets < min_meaningful_bets,
    }


def format_caution_message(result: Dict[str, Any], min_meaningful_bets: int = DEFAULT_MIN_MEANINGFUL_BETS) -> str:
    return (
        f"CAUTION: only {result['total_bets']} qualifying bets -- below "
        f"{min_meaningful_bets}, the ROI/win-rate above is noise, not a result. "
        "Treat this run as a pipeline smoke-test, not evidence of edge, and do "
        "not surface this number to users."
    )
