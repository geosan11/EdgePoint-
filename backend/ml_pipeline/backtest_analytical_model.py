"""
Backtests the EXISTING, already-live FootballMatchModel against real
historical closing odds and outcomes -- the first time this model has ever
been evaluated against anything but hardcoded mock inputs. Requires no ML
training; answers whether the analytical model has ever actually been +EV
against real closing lines, before investing in retraining anything.

football-data.co.uk gives goals, not shot-quality-weighted xG. Two named
proxy variants are computed and reported side by side -- never silently
picked -- so results are never confused with a claim about true xG:
  - "plain": a team's own rolling goals-for average (ignores opponent strength)
  - "adjusted": attack-strength x opponent-defense-weakness, normalized by
    that SEASON's average goals per team (not one constant across 30+ years
    of rule changes) -- a lightweight Dixon-Coles-style estimate, still not
    real xG, but closer.

Market coverage limitations (confirmed against the real data source):
  - BTTS has no odds columns anywhere in this data source -- backtesting it
    is limited to calibration (Brier score), never a real EV/ROI number.
  - Total-line odds only ever cover the 2.5 goals line -- no alternates.
"""

import sys
from pathlib import Path
from typing import Any, Dict, Tuple

import pandas as pd
from sklearn.metrics import brier_score_loss

sys.path.insert(0, str(Path(__file__).parent.parent))

from math_engine import FootballMatchModel, devig_proportional
from betting_simulation import simulate_flat_bet_roi

TOTAL_LINE = 2.5  # the only total line this data source has closing odds for
PROXY_VARIANTS = ("plain", "adjusted")


def compute_goal_expectancy_proxies(df: pd.DataFrame, form_window: int = 5) -> pd.DataFrame:
    """
    Adds home/away goal-expectancy proxy columns for both variants, using
    the rolling home_/away_ goals_for/goals_against columns produced by
    historical_data.build_dataset (e.g. home_goals_for_avg_l5).
    """
    df = df.copy()
    home_for = df[f"home_goals_for_avg_l{form_window}"]
    away_for = df[f"away_goals_for_avg_l{form_window}"]
    home_against = df[f"home_goals_against_avg_l{form_window}"]
    away_against = df[f"away_goals_against_avg_l{form_window}"]

    df["home_goal_expectancy_proxy_plain"] = home_for
    df["away_goal_expectancy_proxy_plain"] = away_for

    season_avg_goals = df.groupby("season_start_year").apply(
        lambda s: pd.concat([s["home_goals"], s["away_goals"]]).mean()
    )
    season_avg_lookup = df["season_start_year"].map(season_avg_goals)

    df["home_goal_expectancy_proxy_adjusted"] = home_for * away_against / season_avg_lookup
    df["away_goal_expectancy_proxy_adjusted"] = away_for * home_against / season_avg_lookup

    return df


def _devig_1x2(home_odds: float, draw_odds: float, away_odds: float) -> Tuple[float, float, float]:
    probs = devig_proportional([home_odds, draw_odds, away_odds])
    return probs[0], probs[1], probs[2]


def _devig_2way(odds_a: float, odds_b: float) -> Tuple[float, float]:
    probs = devig_proportional([odds_a, odds_b])
    return probs[0], probs[1]


def backtest_analytical_model(dataset: pd.DataFrame, proxy_variant: str = "plain") -> pd.DataFrame:
    """
    Runs FootballMatchModel.calculate_match_probabilities on every row with
    non-null proxy inputs, devigging real closing odds for a like-for-like
    fair-probability comparison. Mirrors supabase_sync.py's live +EV gating
    logic, so summarize_backtest() answers "if today's live gating had run
    historically, what would its real ROI against real closing lines have
    been."
    """
    if proxy_variant not in PROXY_VARIANTS:
        raise ValueError(f"proxy_variant must be one of {PROXY_VARIANTS}")

    home_col = f"home_goal_expectancy_proxy_{proxy_variant}"
    away_col = f"away_goal_expectancy_proxy_{proxy_variant}"

    records = []
    for row in dataset.itertuples():
        home_xg = getattr(row, home_col)
        away_xg = getattr(row, away_col)
        if pd.isna(home_xg) or pd.isna(away_xg):
            continue

        probs = FootballMatchModel.calculate_match_probabilities(home_xg, away_xg, TOTAL_LINE)

        record: Dict[str, Any] = {
            "match_id": row.match_id,
            "result": row.result,
            "total_goals": row.total_goals,
            "btts": row.btts,
            "model_home_win": probs["home_win"],
            "model_draw": probs["draw"],
            "model_away_win": probs["away_win"],
            "model_over": probs["over_line"],
            "model_under": probs["under_line"],
            "model_btts_yes": probs["btts_yes"],
        }

        if pd.notna(row.avg_close_home) and pd.notna(row.avg_close_draw) and pd.notna(row.avg_close_away):
            mkt_home, mkt_draw, mkt_away = _devig_1x2(row.avg_close_home, row.avg_close_draw, row.avg_close_away)
            record.update({
                "market_home_win": mkt_home,
                "market_draw": mkt_draw,
                "market_away_win": mkt_away,
                "closing_odds_home": row.avg_close_home,
                "closing_odds_away": row.avg_close_away,
                "home_won": 1 if row.result == "H" else 0,
                "away_won": 1 if row.result == "A" else 0,
            })

        if pd.notna(row.avg_close_over25) and pd.notna(row.avg_close_under25):
            mkt_over, mkt_under = _devig_2way(row.avg_close_over25, row.avg_close_under25)
            record.update({
                "market_over": mkt_over,
                "market_under": mkt_under,
                "closing_odds_over": row.avg_close_over25,
                "over_occurred": 1 if row.total_goals > TOTAL_LINE else 0,
            })

        records.append(record)

    return pd.DataFrame.from_records(records)


def summarize_backtest(results_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Brier score for every market with a known outcome; ROI (via the shared
    simulate_flat_bet_roi) only for markets with real closing odds -- 1X2 and
    Over/Under 2.5. BTTS is calibration-only: no odds exist in this data
    source to compute a real EV/ROI number against.
    """
    summary: Dict[str, Any] = {}

    if "market_home_win" in results_df.columns:
        valid = results_df.dropna(subset=["market_home_win"])
        if len(valid) > 0:
            summary["home_win_brier"] = brier_score_loss(valid["home_won"], valid["model_home_win"])
            summary["home_win_roi"] = simulate_flat_bet_roi(
                valid["model_home_win"], valid["closing_odds_home"], valid["home_won"]
            )
            summary["away_win_brier"] = brier_score_loss(valid["away_won"], valid["model_away_win"])
            summary["away_win_roi"] = simulate_flat_bet_roi(
                valid["model_away_win"], valid["closing_odds_away"], valid["away_won"]
            )

    if "market_over" in results_df.columns:
        valid = results_df.dropna(subset=["market_over"])
        if len(valid) > 0:
            summary["over_brier"] = brier_score_loss(valid["over_occurred"], valid["model_over"])
            summary["over_roi"] = simulate_flat_bet_roi(
                valid["model_over"], valid["closing_odds_over"], valid["over_occurred"]
            )

    if len(results_df) > 0:
        summary["btts_brier"] = brier_score_loss(results_df["btts"], results_df["model_btts_yes"])
        summary["btts_note"] = (
            "No BTTS odds exist in this data source -- calibration only, no ROI/EV possible."
        )

    return summary


def run_backtest(dataset: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Computes both proxy variants and reports backtest results for each,
    side by side -- never silently picking one."""
    enriched = compute_goal_expectancy_proxies(dataset)
    return {
        variant: summarize_backtest(backtest_analytical_model(enriched, proxy_variant=variant))
        for variant in PROXY_VARIANTS
    }


if __name__ == "__main__":
    from config import settings

    dataset_path = (
        Path(__file__).parent.parent / settings.HISTORICAL_DATA_PROCESSED_DIR / "e0_historical_matches.csv"
    )
    if not dataset_path.exists():
        print(f"No dataset found at {dataset_path}. Run historical_data.build_dataset first.")
    else:
        df = pd.read_csv(dataset_path, parse_dates=["match_date"])
        results = run_backtest(df)
        for variant, summary in results.items():
            print(f"\n=== Proxy variant: {variant} ===")
            for key, value in summary.items():
                print(f"{key}: {value}")
