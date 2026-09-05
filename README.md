# EdgePoint+ (+EV Sports Analytics & Algorithmic Parlay Engine)

EdgePoint+ is a modular, automated sports analytics and algorithmic betting platform built to identify positive expected value (+EV), calculate proprietary **EdgeScores** (0–100) and **EdgeDeltas** ($\Delta$), and engineer high-probability multi-leg parlays across global Basketball leagues (NBA, EuroLeague, CBA, PBA, NBL) and Football leagues (EPL, UCL, La Liga).

---

## Project Structure

```
EdgePoint-/
├── backend/                   # Python Quantitative Engine & Ingestion Worker
│   ├── config.py              # Environment configuration & modeling thresholds
│   ├── models.py              # Pydantic schemas for fixtures, odds, predictions, parlays
│   ├── math_engine.py         # Devigging, Poisson (Football), Normal CDF (Basketball), EdgeScore, Kelly
│   ├── odds_fetcher.py        # The Odds API client + offline realistic mock generator
│   ├── supabase_sync.py       # Pipeline orchestrator & Supabase PostgreSQL sync
│   ├── main.py                # FastAPI REST server & standalone CLI daemon runner
│   ├── tests/                 # Comprehensive unit test suite (pytest)
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Backend execution guide
│
├── supabase/                  # PostgreSQL Database & Security Layer
│   ├── migrations/
│   │   ├── 20260905_01_init_schema.sql         # Core tables (profiles, fixtures, predictions, parlays)
│   │   ├── 20260905_02_rls_policies.sql        # Row-Level Security gating Pro predictions
│   │   └── 20260905_03_revenuecat_webhook.sql  # RevenueCat In-App Purchase sync function
│   ├── seed_mock_data.sql                      # Realistic sample data for immediate test
│   └── README.md                               # Supabase setup guide
│
└── mobile/                    # React Native + Expo Cross-Platform App (Coming Next)
```

---

## Core Quantitative Architecture

1. **Vig Stripping & Fair Odds**:
   - Implements Multiplicative Proportional and Power (Shin) devigging models to eliminate bookmaker overround and expose true probability.
2. **Basketball Player Props**:
   - Rolling form weighting ($0.50 \cdot L3 + 0.30 \cdot L5 + 0.20 \cdot L10$).
   - Opponent defensive ranking adjustment & pace normalization (per 100 possessions).
   - Gaussian CDF with continuity correction for Points, Rebounds, Assists, and PRA combo lines.
3. **Football (Soccer) Modeling**:
   - Bivariate Poisson simulations for Expected Goals (xG), Over/Under totals ($1.5, 2.5, 3.5$), and Both Teams to Score (BTTS).
4. **Proprietary EdgeScore & EdgeDelta**:
   - **EdgeScore (0–100)**: Normalized confidence metric combining expected value, line margin disparity, and recent form consistency.
   - **EdgeDelta ($\Delta$)**: Spread/Total margin difference ($\text{Model Output} - \text{Sportsbook Line}$).
5. **PointBlank: Correlated Parlay Engine**:
   - Pairs complementary outcomes across staggered global time zones (CBA/PBA $\rightarrow$ EuroLeague $\rightarrow$ NBA/EPL).
6. **EdgeRadar: Steam Tracker**:
   - Real-time detection of sharp line movement (Pinnacle) vs lagging retail books (SportyBet, Bet365, DraftKings, 1xBet).
7. **Monetization & Security**:
   - Supabase Row-Level Security (RLS) policies protecting Pro picks, with automated RevenueCat entitlement synchronization for iOS StoreKit and Google Play Billing.