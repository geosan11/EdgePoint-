"""
EdgePoint+ Football Feature Engineering
Transforms raw betting history and API data into a tabular ML dataset.
"""

from datetime import datetime

import pandas as pd
import numpy as np
from pathlib import Path

from market_classifier import classify_market

# Paths
RAW_DATA_DIR = Path(__file__).parent.parent / "data" / "raw" / "history"
PROCESSED_DATA_DIR = Path(__file__).parent.parent / "data" / "processed"
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

class FootballFeatureEngineer:
    def __init__(self):
        pass

    def load_raw_data(self, file_path: Path) -> pd.DataFrame:
        """Loads raw JSON/CSV history into a DataFrame."""
        if not file_path.exists():
            print(f"Warning: Raw data file {file_path} not found.")
            return pd.DataFrame()
            
        if file_path.suffix == '.json':
            df = pd.read_json(file_path)
        elif file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        else:
            raise ValueError("Unsupported file format")
            
        return df

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Parses raw bet history and enriches it with features.
        Expected basic columns in raw data:
        - date: timestamp
        - match: string e.g. "Arsenal vs Chelsea"
        - market: string e.g. "Over 2.5", "Home Win"
        - odds: float
        - stake: float
        - result: string ("Won", "Lost", "Void")
        """
        if df.empty:
            return df
            
        # 1. Clean basic columns
        df['date'] = pd.to_datetime(df['date'])
        df = df[df['result'].isin(['Won', 'Lost'])].copy() # Ignore void bets for training
        
        # 2. Binary target variable (1 for Win, 0 for Loss)
        df['target_win'] = (df['result'] == 'Won').astype(int)
        
        # 3. Implied probability from the odds we got
        df['implied_prob'] = 1.0 / df['odds']
        
        # 4. Feature engineering from match string
        # Assuming format "HomeTeam vs AwayTeam"
        try:
            teams = df['match'].str.split(' vs ', expand=True)
            if teams.shape[1] == 2:
                df['home_team'] = teams[0].str.strip()
                df['away_team'] = teams[1].str.strip()
            else:
                df['home_team'] = 'Unknown'
                df['away_team'] = 'Unknown'
        except Exception:
            df['home_team'] = 'Unknown'
            df['away_team'] = 'Unknown'
            
        # 5. Extract market type features via the shared classifier so training
        # can never drift from the identical logic math_engine.py uses at inference.
        market_flags = df['market'].apply(classify_market)
        df['is_over_under'] = market_flags.apply(lambda f: f[0])
        df['is_1x2'] = market_flags.apply(lambda f: f[1])
        
        # 6. Sort chronologically
        df = df.sort_values('date').reset_index(drop=True)
        
        return df
        
    def generate_training_dataset(self, raw_file_name: str = "sportybet_history.json") -> Path:
        """Pipeline to load, process, and save the final dataset."""
        file_path = RAW_DATA_DIR / raw_file_name
        df = self.load_raw_data(file_path)
        
        if df.empty:
            # Create a mock dataframe if no file exists for testing the pipeline
            print("Creating synthetic bet history for testing pipeline...")
            df = pd.DataFrame({
                'date': pd.date_range(start='2025-08-01', periods=100, freq='D'),
                'match': ['Arsenal vs Chelsea', 'Man City vs Liverpool'] * 50,
                'market': ['Over 2.5', 'Home Win'] * 50,
                'odds': np.random.uniform(1.5, 3.5, 100),
                'stake': np.random.uniform(100, 5000, 100),
                'result': np.random.choice(['Won', 'Lost'], 100, p=[0.4, 0.6])
            })
            
        processed_df = self.extract_features(df)
        
        output_path = PROCESSED_DATA_DIR / "football_ml_features.csv"
        processed_df.to_csv(output_path, index=False)
        print(f"[{datetime.now().isoformat()}] Processed features saved to {output_path}")
        return output_path

if __name__ == "__main__":
    engineer = FootballFeatureEngineer()
    engineer.generate_training_dataset()
