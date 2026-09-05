# EdgePoint+ Quantitative Backend & Ingestion Engine

High-performance quantitative sports analytics and algorithmic betting engine for **EdgePoint+**.

## Core Capabilities

1. **Devigging & Fair Price Detection**:
   - **Proportional (Multiplicative) Model**: Strips bookmaker margin evenly across two-way markets.
   - **Power (Shin) Model**: Accurately accounts for longshot bias in multi-outcome markets.
2. **Basketball Player Props**:
   - Rolling form weighting ($0.50 \cdot L3 + 0.30 \cdot L5 + 0.20 \cdot L10$).
   - Opponent defensive efficiency ranking adjustment.
   - Pace normalization (per 100 possessions) & back-to-back rest fatigue penalties.
   - Continuity-corrected Gaussian CDF to determine true probability of clearing points, rebounds, assists, and PRA lines.
3. **Football (Soccer) Bivariate Poisson Modeling**:
   - Expected goals ($\lambda_{\text{home}}, \lambda_{\text{away}}$) simulation.
   - Computes score probability matrix up to $9 \times 9$ scorelines.
   - Outputs true probabilities for Over/Under match totals and Both Teams to Score (BTTS).
4. **Proprietary EdgeScore (0–100) & EdgeDelta ($\Delta$)**:
   - Standardizes value into a single actionable metric.
   - EdgeDelta highlights the raw line disparity ($\text{Model Output} - \text{Sportsbook Line}$).
5. **Fractional Kelly Unit Staking**:
   - Prevents over-exposure by calculating $\frac{1}{4}$ Kelly bankroll allocation capped at $3.0$ units.
6. **PointBlank: Correlated Parlay Engine**:
   - Identifies high-EV legs across global time zones (CBA $\rightarrow$ EuroLeague $\rightarrow$ NBA/EPL).
7. **EdgeRadar Steam Tracker**:
   - Flags line discrepancies between market maker sharp books (Pinnacle) and retail books (SportyBet, Bet365, DraftKings).

---

## Quickstart

### 1. Setup Python Environment
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Run Tests
```bash
pytest tests/ -v
```

### 3. Run Pipeline (CLI)
```bash
# Execute a single quantitative run and print summary
python main.py --run-once

# Or run continuous background daemon polling every 15 minutes
python main.py --daemon --interval 15
```

### 4. Start REST API Server
```bash
python main.py --server --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### API Endpoints:
- `GET /health`: System and database health status.
- `GET /api/predictions`: Query model predictions with filters (`sport`, `tier`, `min_edge_score`).
- `GET /api/parlay/daily`: Fetches the curated PointBlank Daily Slip.
- `GET /api/radar`: Live line movements and steam alerts.
- `POST /api/run-pipeline`: Trigger an immediate ingestion and analytical cycle.
