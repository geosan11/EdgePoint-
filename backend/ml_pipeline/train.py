"""
EdgePoint+ ML Training Pipeline
Trains an XGBoost model on the tabular football betting history.
Evaluates model accuracy (Brier Score) and simulates betting ROI.
"""

from typing import Iterator, List, Optional, Tuple

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import brier_score_loss, roc_auc_score, accuracy_score
try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("XGBoost not installed. Please install with `pip install xgboost`.")

from betting_simulation import (
    DEFAULT_MIN_MEANINGFUL_BETS,
    format_caution_message,
    simulate_flat_bet_roi,
)

PROCESSED_DATA_DIR = Path(__file__).parent.parent / "data" / "processed"
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_FEATURES = ['implied_prob', 'is_over_under', 'is_1x2']


def walk_forward_splits(
    df: pd.DataFrame,
    season_column: str = "season_start_year",
    min_train_seasons: int = 10,
) -> Iterator[Tuple[pd.DataFrame, pd.DataFrame]]:
    """
    Expanding-window walk-forward: yields (train_df, test_df) where test_df
    is exactly one season and train_df is every strictly earlier season. The
    first min_train_seasons seasons are never used as a test set. Produces a
    Brier score/ROI PER held-out season rather than one point estimate from
    an arbitrary single split -- football has real regime shifts (squad
    changes, rule changes) a single split can hide.
    """
    seasons = sorted(df[season_column].unique())
    for i, test_season in enumerate(seasons):
        if i < min_train_seasons:
            continue
        train_df = df[df[season_column].isin(seasons[:i])]
        test_df = df[df[season_column] == test_season]
        if len(train_df) == 0 or len(test_df) == 0:
            continue
        yield train_df, test_df


class EdgeModelTrainer:
    def __init__(self, features: Optional[List[str]] = None, model_filename: str = "football_xgb_v1.joblib"):
        self.model = None
        # 'odds' is deliberately excluded: implied_prob is 1/odds, so the two
        # are the same information twice -- keeping both adds redundant,
        # collinear input rather than a second real signal.
        self.features = features or DEFAULT_FEATURES
        self.model_filename = model_filename

    def load_data(self) -> pd.DataFrame:
        file_path = PROCESSED_DATA_DIR / "football_ml_features.csv"
        if not file_path.exists():
            raise FileNotFoundError(f"Missing feature data at {file_path}")
        return pd.read_csv(file_path)

    def train_model(self, df: pd.DataFrame):
        if not XGB_AVAILABLE:
            return

        print(f"Training on {len(df)} historical bets...")
        
        # Prepare X and y
        X = df[self.features]
        y = df['target_win']
        
        # shuffle=False on data already sorted by date (see extract_features)
        # gives a chronological holdout: train on the earliest 80%, test on
        # the most recent 20%. A single split is still thin for a time series
        # with regime changes (squads/form/strategy shift season to season) --
        # walk-forward/rolling CV is the next upgrade once there's enough
        # real data to support it.
        X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
            X, y, df, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Train XGBoost
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=4,
            objective='binary:logistic',
            eval_metric='logloss',
            random_state=42
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        preds_proba = self.model.predict_proba(X_test)[:, 1]
        
        brier = brier_score_loss(y_test, preds_proba)
        auc = roc_auc_score(y_test, preds_proba)
        
        print("\n--- Model Evaluation ---")
        print(f"Brier Score (lower is better): {brier:.4f}")
        print(f"ROC AUC: {auc:.4f}")
        
        # Feature Importance
        importances = self.model.feature_importances_
        print("\n--- Feature Importance ---")
        for feature, imp in zip(self.features, importances):
            print(f"{feature}: {imp:.4f}")
            
        # Simulate Betting Strategy
        self._simulate_betting(df_test, preds_proba)
        
        # Save model
        model_path = MODEL_DIR / self.model_filename
        joblib.dump(self.model, model_path)
        print(f"\nModel saved to {model_path}")

    def train_with_walk_forward(
        self,
        df: pd.DataFrame,
        season_column: str = "season_start_year",
        min_train_seasons: int = 10,
        save_final_model: bool = True,
    ) -> List[dict]:
        """
        Honest out-of-sample evaluation for real historical data: one
        Brier score/ROI per held-out season via walk_forward_splits(),
        printed per season rather than as a single aggregate. Once this
        loop is satisfactory, a final model is fit on ALL available seasons
        and saved to self.model_filename (never football_xgb_v1.joblib
        unless explicitly configured to do so).
        """
        if not XGB_AVAILABLE:
            return []

        per_season_results = []
        for train_df, test_df in walk_forward_splits(df, season_column, min_train_seasons):
            test_season = test_df[season_column].iloc[0]
            model = xgb.XGBClassifier(
                n_estimators=100, learning_rate=0.05, max_depth=4,
                objective='binary:logistic', eval_metric='logloss', random_state=42
            )
            model.fit(train_df[self.features], train_df['target_win'])
            preds_proba = model.predict_proba(test_df[self.features])[:, 1]

            brier = brier_score_loss(test_df['target_win'], preds_proba)
            roi_result = simulate_flat_bet_roi(
                pd.Series(preds_proba, index=test_df.index), test_df['odds'], test_df['target_win']
            )
            print(f"\n--- Held-out season {test_season} (trained on {len(train_df)} prior rows) ---")
            print(f"Brier Score: {brier:.4f}")
            print(f"+EV bets: {roi_result['total_bets']} / {roi_result['total_available']}")
            if roi_result['total_bets'] > 0:
                print(f"ROI: {roi_result['roi']:.2%}")
                if roi_result["below_minimum_sample"]:
                    print(format_caution_message(roi_result))

            per_season_results.append({"season": test_season, "brier": brier, **roi_result})

        if save_final_model:
            self.model = xgb.XGBClassifier(
                n_estimators=100, learning_rate=0.05, max_depth=4,
                objective='binary:logistic', eval_metric='logloss', random_state=42
            )
            self.model.fit(df[self.features], df['target_win'])
            model_path = MODEL_DIR / self.model_filename
            joblib.dump(self.model, model_path)
            print(f"\nFinal model (trained on all {len(df)} rows) saved to {model_path}")

        return per_season_results

    def _simulate_betting(self, df_test: pd.DataFrame, preds_proba: np.ndarray):
        """Simulate flat-unit betting on +EV test-set predictions, via the
        shared simulate_flat_bet_roi() -- the same definition of "+EV" and
        "meaningful sample size" used by the historical-data backtest, so
        the two can never silently disagree on what those mean."""
        model_prob = pd.Series(preds_proba, index=df_test.index)
        result = simulate_flat_bet_roi(
            model_probability=model_prob,
            decimal_odds=df_test['odds'],
            won=df_test['target_win'],
            min_meaningful_bets=DEFAULT_MIN_MEANINGFUL_BETS,
        )

        if result["total_bets"] == 0:
            print("\nNo +EV bets found in the test set by the model.")
            return

        print("\n--- Backtest Strategy (Flat 1 Unit on +EV > 2%) ---")
        print(f"Total Bets Placed: {result['total_bets']} / {result['total_available']} available")
        print(f"Win Rate: {result['win_rate']:.2%}")
        print(f"Total Profit: {result['total_profit']:.2f} Units")
        print(f"ROI: {result['roi']:.2%}")

        if result["below_minimum_sample"]:
            print(f"\n{format_caution_message(result, DEFAULT_MIN_MEANINGFUL_BETS)}")

if __name__ == "__main__":
    trainer = EdgeModelTrainer()
    try:
        df = trainer.load_data()
        trainer.train_model(df)
    except Exception as e:
        print(f"Training failed: {e}")
