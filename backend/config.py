"""
EdgePoint+ Backend Configuration
Handles environment variables, API keys, database settings, and modeling thresholds.
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project Info
    APP_NAME: str = "EdgePoint+ Quantitative Engine"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Supabase Configuration
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL")
    SUPABASE_KEY: Optional[str] = Field(default=None, description="Supabase service role or anon key")
    
    # Sports API Configuration
    THE_ODDS_API_KEY: Optional[str] = Field(default=None, description="API Key for The Odds API")
    API_FOOTBALL_KEY: Optional[str] = Field(default=None, description="API Key for API-Football / API-Sports")
    
    # Execution & Pipeline Modes
    # If MOCK_MODE is True or API keys are not supplied, the system automatically uses
    # realistic synthetic fixtures and odds boards for zero-cost offline development.
    MOCK_MODE: bool = Field(default=True, description="Enable simulated live data without calling external paid APIs")
    POLL_INTERVAL_MINUTES: int = Field(default=15, description="Minutes between automated data polling cycles")

    # Edge Modeling Thresholds
    MIN_EV_PERCENTAGE: float = Field(default=3.0, description="Minimum +EV percentage to qualify as a model pick")
    MIN_EDGE_SCORE: float = Field(default=70.0, description="Minimum EdgeScore (0-100) to recommend to users")
    KELLY_FRACTION: float = Field(default=0.25, description="Fractional Kelly multiplier for bankroll unit sizing")
    MAX_RECOMMENDED_UNITS: float = Field(default=3.0, description="Hard cap on recommended staking units per bet")
    
    # Free Tier Gating
    FREE_TIER_DAILY_PICKS: int = Field(default=2, description="Number of teaser picks accessible to non-paying users daily")

    # ML Model Blending (backend/ml_pipeline/)
    ML_BLEND_ENABLED: bool = Field(
        default=False,
        description="Master switch for blending the trained football_xgb model's probability "
                     "into predictions. Off by default -- turn on only once a model trained on "
                     "real (non-synthetic) historical data has been validated out-of-sample."
    )
    ML_BLEND_WEIGHT: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Weight given to the ML model's probability vs. the analytical heuristic "
                     "when ML_BLEND_ENABLED is True. Starts conservative (favoring the proven "
                     "heuristic) until the model demonstrates real edge on held-out data."
    )

    # Historical Data Pipeline (backend/historical_data/)
    FOOTBALL_DATA_CO_UK_BASE_URL: str = Field(
        default="https://www.football-data.co.uk/mmz4281",
        description="Base URL for football-data.co.uk historical season CSVs. NOTE: this "
                     "free, no-auth source has no explicit commercial-use license found (only "
                     "source credits, no terms of use) -- confirm with the site owner before "
                     "this pipeline's output ever influences live, paying-subscriber "
                     "predictions. Safe for internal backtesting/model-validation in the "
                     "meantime."
    )
    HISTORICAL_DATA_LEAGUES: str = Field(
        default="E0",
        description="Comma-separated football-data.co.uk league codes to fetch (E0 = EPL). "
                     "Scoped to EPL only for now; multi-league is a future extension."
    )
    HISTORICAL_DATA_START_SEASON: int = Field(
        default=1993,
        description="Earliest season start-year to fetch (1993 = 1993/94, the first EPL "
                     "season in football-data.co.uk's archive)."
    )
    HISTORICAL_DATA_END_SEASON: Optional[int] = Field(
        default=None,
        description="Latest season start-year to fetch (None = auto-detect the current "
                     "season). Set explicitly to freeze a dataset snapshot for reproducible "
                     "backtests."
    )
    HISTORICAL_DATA_CACHE_DIR: str = Field(
        default="data/raw/football_data_co_uk",
        description="Directory (relative to backend/) for cached season CSVs. Lives under "
                     "backend/data/, already excluded by .gitignore."
    )
    HISTORICAL_DATA_PROCESSED_DIR: str = Field(
        default="data/processed",
        description="Directory (relative to backend/) for the assembled historical dataset CSV."
    )
    HISTORICAL_ROLLING_WINDOWS: str = Field(
        default="3,5,10",
        description="Comma-separated rolling-form window sizes (in matches) for pre-match form."
    )
    HISTORICAL_MIN_ROLLING_WINDOW_REQUIRED: int = Field(
        default=5,
        description="Minimum rolling window that must have sufficient prior-match history for "
                     "a row to be kept in the training dataset; rows lacking this many prior "
                     "matches for either team are dropped, never imputed."
    )
    HISTORICAL_DATA_REQUEST_DELAY_SECONDS: float = Field(
        default=1.0,
        description="Delay between sequential football-data.co.uk downloads. This host has "
                     "been observed returning HTTP 429 after only a handful of rapid requests "
                     "-- fetch sequentially, never in parallel."
    )

    # API / CORS
    INTERNAL_API_KEY: Optional[str] = Field(
        default=None,
        description="When set, /api/predictions and /api/parlay/daily require this value in "
                     "the X-API-Key header to receive Pro-tier data; callers without it only "
                     "see free-tier picks. Leave unset for local/dev use (fully open, matching "
                     "MOCK_MODE's zero-config experience) -- set it before exposing this API "
                     "beyond trusted internal callers, since the mobile app itself talks to "
                     "Supabase directly and its RLS policies are the real per-user gate."
    )
    ALLOWED_ORIGINS: str = Field(
        default="*",
        description="Comma-separated list of allowed CORS origins for the REST API. "
                     "Leave as '*' for local development only; set to your app's real "
                     "origin(s) in production so credentialed requests are permitted."
    )


settings = Settings()
