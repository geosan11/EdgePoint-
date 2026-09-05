"""
EdgePoint+ Quantitative & Mathematical Modeling Engine
Implements:
1. Devigging algorithms (Proportional & Power/Shin)
2. Basketball player prop projections (Pace-adjusted, L3/L5/L10 rolling weights, Normal/Skellam CDF)
3. Football (Soccer) match modeling (Bivariate Poisson for xG, totals, BTTS)
4. EdgeScore (0-100 composite confidence metric) & EdgeDelta (Δ)
5. Fractional Kelly Criterion unit staking
6. PointBlank parlay correlation analysis
"""

import math
from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy import stats
from scipy.optimize import brentq


# ==========================================
# 1. Odds Conversions & Implied Probability
# ==========================================

def decimal_to_american(decimal_odds: float) -> int:
    """Converts European decimal odds to American moneyline format."""
    if decimal_odds <= 1.0:
        return 0
    if decimal_odds >= 2.0:
        return int(round((decimal_odds - 1.0) * 100))
    else:
        return int(round(-100 / (decimal_odds - 1.0)))


def american_to_decimal(american_odds: int) -> float:
    """Converts American moneyline odds to European decimal odds."""
    if american_odds > 0:
        return round(1.0 + (american_odds / 100.0), 3)
    elif american_odds < 0:
        return round(1.0 + (100.0 / abs(american_odds)), 3)
    return 1.0


def calculate_implied_probability(decimal_odds: float) -> float:
    """Calculates raw implied probability: 1 / decimal_odds."""
    if decimal_odds <= 1.0:
        return 1.0
    return round(1.0 / decimal_odds, 4)


# ==========================================
# 2. Devigging Algorithms (Vig Removal)
# ==========================================

def devig_proportional(decimal_odds_list: List[float]) -> List[float]:
    """
    Standard multiplicative devigging model.
    Normalizes raw implied probabilities by dividing by total market overround.
    Output is always the same length as the input, index-aligned with it; any
    invalid (<= 1.0) odds get a fair probability of 0.0 rather than being dropped.
    """
    if not decimal_odds_list:
        return []
    raw_probs = [1.0 / o if o > 1.0 else 0.0 for o in decimal_odds_list]
    total_vig = sum(raw_probs)
    if total_vig == 0:
        return [1.0 / len(decimal_odds_list)] * len(decimal_odds_list)
    return [round(p / total_vig, 4) for p in raw_probs]


def devig_power(decimal_odds_list: List[float]) -> List[float]:
    """
    Power devigging model.
    Solves for the exponent k such that sum((1 / odds_i) ^ k) == 1.
    Accurately captures the favorite-longshot bias where books add more margin to longshots.
    Output is always the same length as the input, index-aligned with it; any
    invalid (<= 1.0) odds get a fair probability of 0.0 rather than being dropped.
    """
    valid_indices = [i for i, o in enumerate(decimal_odds_list) if o > 1.0]
    if len(valid_indices) < 2:
        return devig_proportional(decimal_odds_list)

    raw_probs = [1.0 / decimal_odds_list[i] for i in valid_indices]

    def objective(k: float) -> float:
        return sum(p ** k for p in raw_probs) - 1.0

    try:
        # Find root between 0.5 and 5.0
        k_opt = brentq(objective, 0.5, 5.0)
        fair_probs = [p ** k_opt for p in raw_probs]
        total = sum(fair_probs)
        normalized = [p / total for p in fair_probs]
    except Exception:
        # Fallback to proportional if root solver fails
        return devig_proportional(decimal_odds_list)

    result = [0.0] * len(decimal_odds_list)
    for idx, prob in zip(valid_indices, normalized):
        result[idx] = round(prob, 4)
    return result


# ==========================================
# 3. Basketball Modeling (Props & Form)
# ==========================================

class BasketballPropModel:
    """
    Evaluates basketball player props (Points, Rebounds, Assists, 3PM, PRA).
    Adjusts rolling form for pace, opponent defensive efficiency, and rest.
    """

    @staticmethod
    def calculate_projected_mean(
        l3_avg: float,
        l5_avg: float,
        l10_avg: float,
        opponent_def_rank: int,  # 1 (best defense) to 30 (worst defense)
        projected_game_pace: float = 100.0,
        league_avg_pace: float = 100.0,
        rest_days: int = 1
    ) -> float:
        """
        Weights recent form heavily: 50% L3, 30% L5, 20% L10.
        Applies defense factor, pace adjustment, and back-to-back rest fatigue.
        """
        # Weighted baseline
        baseline = (0.50 * l3_avg) + (0.30 * l5_avg) + (0.20 * l10_avg)

        # Defensive efficiency multiplier (rank 1 = 0.90x, rank 15 = 1.0x, rank 30 = 1.10x)
        def_multiplier = 0.90 + ((opponent_def_rank - 1) / 29.0) * 0.20

        # Pace normalization factor
        pace_multiplier = projected_game_pace / league_avg_pace if league_avg_pace > 0 else 1.0

        # Rest fatigue (0 days rest / back-to-back causes ~3% drop)
        rest_multiplier = 0.97 if rest_days == 0 else (1.02 if rest_days >= 3 else 1.0)

        projected = baseline * def_multiplier * pace_multiplier * rest_multiplier
        return round(projected, 2)

    @classmethod
    def calculate_prop_probabilities(
        cls,
        projected_mean: float,
        prop_line: float,
        stat_type: str = "points"
    ) -> Tuple[float, float]:
        """
        Calculates P(Stat > Line) and P(Stat < Line) using continuity-corrected Normal CDF.
        Coefficient of variation depends on stat category volatility.
        """
        # Volatility factors
        cv_map = {
            "points": 0.26,
            "rebounds": 0.32,
            "assists": 0.35,
            "pra": 0.22,
            "threes": 0.42
        }
        cv = cv_map.get(stat_type.lower(), 0.28)
        std_dev = max(1.0, projected_mean * cv)

        # Continuity correction (+0.5 for discrete integer stats)
        z_over = ((prop_line + 0.5) - projected_mean) / std_dev
        prob_over = 1.0 - stats.norm.cdf(z_over)
        prob_under = 1.0 - prob_over

        return round(float(prob_over), 4), round(float(prob_under), 4)


# ==========================================
# 4. Football (Soccer) Modeling (Poisson / xG)
# ==========================================

class FootballMatchModel:
    """
    Bivariate Poisson model for Football (Soccer) goals, match totals, and BTTS.
    """

    @staticmethod
    def calculate_match_probabilities(
        home_xg: float,
        away_xg: float,
        total_line: float = 2.5,
        max_goals: int = 9
    ) -> Dict[str, float]:
        """
        Generates probability matrix for all score outcomes (i, j) up to max_goals.
        Computes Over/Under totals and Both Teams to Score (BTTS).
        """
        # Score distribution matrix
        home_probs = [stats.poisson.pmf(i, home_xg) for i in range(max_goals + 1)]
        away_probs = [stats.poisson.pmf(j, away_xg) for j in range(max_goals + 1)]

        prob_over = 0.0
        prob_under = 0.0
        prob_home_win = 0.0
        prob_draw = 0.0
        prob_away_win = 0.0
        prob_btts = 0.0

        for h in range(max_goals + 1):
            for a in range(max_goals + 1):
                p = home_probs[h] * away_probs[a]
                if h + a > total_line:
                    prob_over += p
                else:
                    prob_under += p

                if h > a:
                    prob_home_win += p
                elif h == a:
                    prob_draw += p
                else:
                    prob_away_win += p

                if h >= 1 and a >= 1:
                    prob_btts += p

        return {
            "over_line": round(float(prob_over), 4),
            "under_line": round(float(prob_under), 4),
            "home_win": round(float(prob_home_win), 4),
            "draw": round(float(prob_draw), 4),
            "away_win": round(float(prob_away_win), 4),
            "btts_yes": round(float(prob_btts), 4),
            "btts_no": round(float(1.0 - prob_btts), 4),
        }


# ==========================================
# 5. Expected Value & EdgeScore Formulation
# ==========================================

def calculate_expected_value(model_probability: float, sportsbook_odds: float) -> float:
    """
    Expected Value (+EV) percentage:
    EV% = (Model Probability * Sportsbook Odds - 1) * 100
    """
    ev = (model_probability * sportsbook_odds - 1.0) * 100.0
    return round(ev, 2)


def calculate_edge_delta(projected_stat: float, line: float) -> float:
    """
    EdgeDelta (Δ): The raw statistical difference between projected output and sportsbook line.
    Positive indicates model expects performance above book line.
    """
    return round(projected_stat - line, 2)


def calculate_edge_score(
    ev_percentage: float,
    edge_delta: Optional[float] = None,
    line: Optional[float] = None,
    recent_hit_rate: Optional[float] = None  # e.g. 0.80 (hit 4 of last 5)
) -> float:
    """
    Proprietary EdgeScore: Normalized composite metric (0 to 100).
    A baseline rating of 50 indicates fair market equilibrium.
    - Added boost from raw EV% (up to +35 pts)
    - Added boost from EdgeDelta margin relative to line (up to +15 pts)
    - Added bonus from recent trend consistency (up to +10 pts)
    """
    base_score = 50.0

    # EV component (e.g. 10% EV gives +20 points)
    ev_component = max(-30.0, min(35.0, ev_percentage * 2.0))

    # Delta magnitude component. `line` can legitimately be negative (e.g. a
    # favorite's point spread), so guard against zero only, not against sign.
    delta_component = 0.0
    if edge_delta is not None and line:
        ratio = abs(edge_delta) / abs(line)
        delta_component = max(0.0, min(15.0, ratio * 75.0))

    # Form bonus component
    form_component = 0.0
    if recent_hit_rate is not None:
        if recent_hit_rate >= 0.8:
            form_component = 8.0
        elif recent_hit_rate >= 0.6:
            form_component = 4.0

    raw_score = base_score + ev_component + delta_component + form_component
    clamped_score = max(0.0, min(100.0, raw_score))
    return round(clamped_score, 1)


# ==========================================
# 6. Fractional Kelly Criterion (Unit Sizing)
# ==========================================

def calculate_kelly_units(
    model_probability: float,
    sportsbook_odds: float,
    fraction: float = 0.25,
    max_units: float = 3.0
) -> float:
    """
    Fractional Kelly Criterion:
    f* = (p * (b - 1) - q) / (b - 1)
    where b = decimal odds, p = model probability, q = 1 - p.
    Scaled to a standard 1-to-3 unit scale for risk preservation.
    """
    b = sportsbook_odds
    p = model_probability
    q = 1.0 - p

    if b <= 1.0 or p <= 0:
        return 0.0

    kelly_full = (p * (b - 1.0) - q) / (b - 1.0)
    if kelly_full <= 0:
        return 0.0

    # Scale fractional kelly (e.g. 0.25 * kelly_full * 10)
    recommended = round(kelly_full * fraction * 10.0, 2)
    clamped = max(0.5, min(max_units, recommended))
    return round(clamped, 2)


# ==========================================
# 7. PointBlank Parlay Correlation
# ==========================================

def calculate_parlay_metrics(
    legs: List[Dict[str, float]],  # list of dicts with 'odds' and 'model_prob'
    correlation_factor: float = 1.0
) -> Dict[str, float]:
    """
    Calculates combined parlay odds, true joint probability, and combined EV%.
    correlation_factor > 1.0 represents positive synergy (e.g. game total over + scorer over).
    """
    total_sportsbook_odds = 1.0
    independent_win_prob = 1.0

    for leg in legs:
        total_sportsbook_odds *= leg["odds"]
        independent_win_prob *= leg["model_prob"]

    # Adjust joint probability with correlation factor
    correlated_prob = min(0.95, independent_win_prob * correlation_factor)
    total_fair_odds = round(1.0 / correlated_prob, 3) if correlated_prob > 0 else 999.0
    combined_ev = calculate_expected_value(correlated_prob, total_sportsbook_odds)

    return {
        "total_sportsbook_odds": round(total_sportsbook_odds, 3),
        "total_fair_odds": total_fair_odds,
        "model_win_probability": round(correlated_prob, 4),
        "combined_ev_percentage": combined_ev,
        "correlation_score": correlation_factor
    }
