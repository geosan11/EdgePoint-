"""
Tests for ml_pipeline/train.py's walk-forward validation additions.
Never writes into the real backend/models/ -- MODEL_DIR is monkeypatched to
a tmp_path for every test that saves a model.
"""

import sys
import os

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_pipeline")))

import ml_pipeline.train as train_module
from ml_pipeline.train import EdgeModelTrainer, walk_forward_splits


def _synthetic_seasons_df(seasons, rows_per_season=20, seed=0):
    rng = np.random.default_rng(seed)
    frames = []
    for season in seasons:
        implied_prob = rng.uniform(0.3, 0.7, rows_per_season)
        frames.append(pd.DataFrame({
            "season_start_year": season,
            "implied_prob": implied_prob,
            "is_over_under": rng.integers(0, 2, rows_per_season),
            "is_1x2": rng.integers(0, 2, rows_per_season),
            "odds": 1.0 / implied_prob,
            # deterministic-ish separable target so the model has something to learn
            "target_win": (implied_prob > 0.5).astype(int),
        }))
    return pd.concat(frames, ignore_index=True)


def test_walk_forward_splits_respects_min_train_seasons():
    df = _synthetic_seasons_df([2018, 2019, 2020, 2021])
    splits = list(walk_forward_splits(df, min_train_seasons=1))

    # seasons index 0 skipped (< min_train_seasons); index 1,2,3 -> 3 splits
    assert len(splits) == 3
    test_seasons = [test_df["season_start_year"].iloc[0] for _, test_df in splits]
    assert test_seasons == [2019, 2020, 2021]


def test_walk_forward_splits_never_leak_future_seasons_into_train():
    df = _synthetic_seasons_df([2018, 2019, 2020, 2021])
    for train_df, test_df in walk_forward_splits(df, min_train_seasons=1):
        test_season = test_df["season_start_year"].iloc[0]
        assert (train_df["season_start_year"] < test_season).all()


def test_walk_forward_splits_expanding_window_grows_train_set():
    df = _synthetic_seasons_df([2018, 2019, 2020, 2021])
    splits = list(walk_forward_splits(df, min_train_seasons=1))
    train_sizes = [len(train_df) for train_df, _ in splits]
    assert train_sizes == sorted(train_sizes)  # strictly non-decreasing


def test_train_with_walk_forward_returns_per_season_results(tmp_path, monkeypatch):
    monkeypatch.setattr(train_module, "MODEL_DIR", tmp_path)
    df = _synthetic_seasons_df([2018, 2019, 2020, 2021], rows_per_season=30)

    trainer = EdgeModelTrainer(model_filename="test_model.joblib")
    results = trainer.train_with_walk_forward(df, min_train_seasons=1)

    assert len(results) == 3
    for r in results:
        assert "season" in r and "brier" in r
        assert 0.0 <= r["brier"] <= 1.0


def test_train_with_walk_forward_saves_final_model_to_configured_filename(tmp_path, monkeypatch):
    monkeypatch.setattr(train_module, "MODEL_DIR", tmp_path)
    df = _synthetic_seasons_df([2018, 2019, 2020, 2021], rows_per_season=30)

    trainer = EdgeModelTrainer(model_filename="football_xgb_v2_epl_historical.joblib")
    trainer.train_with_walk_forward(df, min_train_seasons=1)

    assert (tmp_path / "football_xgb_v2_epl_historical.joblib").exists()
    # Must never silently overwrite the existing production v1 artifact.
    assert not (tmp_path / "football_xgb_v1.joblib").exists()


def test_default_features_unchanged_for_backward_compatibility():
    trainer = EdgeModelTrainer()
    assert trainer.features == ['implied_prob', 'is_over_under', 'is_1x2']


def test_custom_features_can_be_supplied():
    trainer = EdgeModelTrainer(features=['implied_prob', 'home_goals_for_avg_l5'])
    assert trainer.features == ['implied_prob', 'home_goals_for_avg_l5']
