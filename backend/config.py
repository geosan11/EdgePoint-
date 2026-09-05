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
