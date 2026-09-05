"""
EdgePoint+ Domain Models
Pydantic schemas for fixtures, odds snapshots, quantitative predictions, parlays, and line movements.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class Sport(str, Enum):
    BASKETBALL = "basketball"
    FOOTBALL = "football"


class LeagueId(str, Enum):
    # Basketball
    NBA = "basketball_nba"
    EUROLEAGUE = "basketball_euroleague"
    CBA = "basketball_cba"
    PBA = "basketball_pba"
    NBL = "basketball_nbl"
    # Football
    EPL = "soccer_epl"
    UCL = "soccer_uefa_champs_league"
    LA_LIGA = "soccer_spain_la_liga"


class MarketType(str, Enum):
    # Basketball Props
    PLAYER_POINTS = "player_points"
    PLAYER_REBOUNDS = "player_rebounds"
    PLAYER_ASSISTS = "player_assists"
    PRA_COMBO = "pra_combo"
    # Football & Game Markets
    MATCH_TOTAL = "match_total"
    SPREAD = "spread"
    BTTS = "btts"
    MONEYLINE = "h2h"


class Selection(str, Enum):
    OVER = "Over"
    UNDER = "Under"
    HOME = "Home"
    AWAY = "Away"
    YES = "Yes"
    NO = "No"


class Tier(str, Enum):
    FREE = "free"
    PRO = "pro"


class PredictionStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    PUSH = "push"
    VOID = "void"


class Fixture(BaseModel):
    id: str
    sport: Sport
    league_id: str
    home_team: str
    away_team: str
    commence_time: datetime
    status: str = "scheduled"
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    venue: Optional[str] = None


class Outcome(BaseModel):
    name: str
    price: float  # Decimal odds (e.g. 1.91)
    point: Optional[float] = None  # Spread or Over/Under line (e.g. 24.5, -4.5)


class OddsSnapshot(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    fixture_id: str
    bookmaker: str
    market_key: str
    outcomes: List[Outcome]
    captured_at: datetime = Field(default_factory=datetime.utcnow)


class ModelPrediction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    fixture_id: str
    sport: Sport
    league_id: str
    league_name: Optional[str] = None
    match_title: str
    commence_time: datetime
    market_type: MarketType
    player_name: Optional[str] = None
    team_name: Optional[str] = None
    selection: Selection
    line: Optional[float] = None
    best_bookmaker: str
    sportsbook_odds: float
    american_odds: Optional[int] = None
    implied_probability: float
    fair_odds: float
    model_probability: float
    model_projected_stat: Optional[float] = None
    edge_delta: Optional[float] = None
    ev_percentage: float
    edge_score: float = Field(ge=0.0, le=100.0)
    recommended_units: float = 1.0
    tier: Tier = Tier.PRO
    status: PredictionStatus = PredictionStatus.PENDING
    analysis_notes: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ParlayLeg(BaseModel):
    prediction_id: Optional[str] = None
    fixture: str
    prop: str
    selection: str
    odds: float
    ev: str
    bookmaker: str


class CuratedParlay(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str = "The Daily PointBlank Slip"
    slate_date: str
    legs: List[ParlayLeg]
    total_sportsbook_odds: float
    total_fair_odds: float
    model_win_probability: float
    combined_ev_percentage: float
    correlation_score: float
    recommended_units: float = 0.5
    tier: Tier = Tier.PRO
    status: PredictionStatus = PredictionStatus.PENDING
    summary_analysis: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LineMovement(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    fixture_id: str
    sport: Sport
    match_title: str
    market_key: str
    selection: str
    opening_odds: float
    current_odds: float
    opening_line: Optional[float] = None
    current_line: Optional[float] = None
    steam_direction: Optional[str] = None
    sharp_book: str = "Pinnacle"
    divergent_book: str
    divergence_percentage: float
    alert_type: str  # 'steam_move', 'reverse_line_movement', 'off_market_line'
    created_at: datetime = Field(default_factory=datetime.utcnow)
