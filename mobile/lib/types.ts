export type Sport = 'basketball' | 'football';

export type MarketType =
  | 'player_points'
  | 'player_rebounds'
  | 'player_assists'
  | 'player_threes'
  | 'pra_combo'
  | 'match_total'
  | 'spread'
  | 'moneyline'
  | 'btts'
  | 'shots_on_target';

export type Tier = 'free' | 'pro';

export interface MatchFixture {
  id: string;
  sport: Sport;
  league: 'NBA' | 'Premier League';
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'upcoming' | 'finished';
  gameClock?: string; // e.g. "Q3 4:28" or "68'"
  commenceTime: string;
  stadium?: string;
  markets: {
    moneyline?: {
      home: number;
      away: number;
      draw?: number;
      bestBook: string;
    };
    spread?: {
      line: number;
      homeOdds: number;
      awayOdds: number;
      bestBook: string;
    };
    total?: {
      line: number;
      overOdds: number;
      underOdds: number;
      bestBook: string;
    };
  };
  modelEdge?: {
    market: string;
    pick: string;
    edgePct: number;
    modelProb: number;
  };
}

export interface Prediction {
  id: string;
  fixture_id: string;
  sport: Sport;
  league_id: string;
  league_name?: string;
  market_type: MarketType;
  player_name?: string;
  team_name?: string;
  match_title: string;
  selection: 'Over' | 'Under' | 'Home' | 'Away' | 'Yes' | 'No';
  line?: number;
  best_bookmaker: string;
  sportsbook_odds: number;
  american_odds?: number;
  implied_probability: number;
  fair_odds: number;
  model_probability: number;
  model_projected_stat?: number;
  edge_delta?: number;
  ev_percentage: number;
  edge_score: number; // 0 - 100
  recommended_units: number;
  tier: Tier;
  status: 'pending' | 'won' | 'lost' | 'push';
  commence_time: string;
  analysis_notes?: Record<string, any>;
}

export interface ParlayLeg {
  prediction_id?: string;
  fixture: string;
  prop: string;
  selection: string;
  odds: number;
  ev: string;
  bookmaker: string;
  edge_score?: number;
}

export interface CuratedParlay {
  id: string;
  title: string;
  slate_date: string;
  legs: ParlayLeg[];
  total_sportsbook_odds: number;
  total_fair_odds: number;
  model_win_probability: number;
  combined_ev_percentage: number;
  correlation_score: number;
  recommended_units: number;
  tier: Tier;
  status: 'pending' | 'won' | 'lost';
  summary_analysis?: string;
}

export interface LineMovement {
  id: string;
  fixture_id: string;
  match_title: string;
  sport: Sport;
  market_key: string;
  selection: string;
  opening_odds: number;
  current_odds: number;
  opening_line?: number;
  current_line?: number;
  steam_direction: 'shortening' | 'drifting' | 'line_shift';
  sharp_book: string;
  divergent_book: string;
  divergence_percentage: number;
  alert_type: 'steam_move' | 'reverse_line_movement' | 'market_arbitrage' | 'off_market_line';
  created_at: string;
}

export interface TrackerBet {
  id: string;
  date: string;
  fixture: string;
  prop: string;
  sport: Sport;
  odds: number;
  stake: number; // in unit or currency
  stakeUnits: number;
  result: 'won' | 'lost' | 'pending';
  pnl: number;
  modelEdge: number;
  closingLineValue?: number; // CLV %
}

export interface LeagueTrendInsight {
  id: string;
  sport: Sport;
  league: 'NBA' | 'Premier League';
  title: string;
  subtitle: string;
  stat: string;
  statLabel: string;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  subscriptionTier: 'free' | 'edgepoint_pro';
  subscriptionStatus: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd?: string;
  bankroll: number;
  unitSize: number;
  currency: 'USD' | 'NGN';
}

export interface TipsterProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  badge: 'verified_sharp' | 'pro_capper' | 'algo_model';
  bio: string;
  specialty: string;
  winRate: number;
  roiPct: number;
  unitsWon: number;
  clvPct: number;
  subscribersCount: number;
  monthlyPriceUSD: number;
  monthlyPriceNGN: number;
  recentStreak: string;
  isVerified: boolean;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorBadge: 'verified_sharp' | 'pro_capper' | 'algo_model';
  authorWinRate: number;
  authorRoi: number;
  createdAt: string;
  type: 'prediction' | 'news';
  league: 'NBA' | 'Premier League';
  title: string;
  content: string;
  isVip: boolean;
  predictionData?: {
    fixture: string;
    prop: string;
    selection: string;
    line?: number;
    odds: number;
    units: number;
    bookmaker: string;
    modelProb?: number;
  };
  newsCategory?: 'injury' | 'line_move' | 'tactical';
  tailCount: number;
  fadeCount: number;
  userReaction?: 'tail' | 'fade';
  commentsCount: number;
}

export interface DeepAnalytics {
  predictionId: string;
  convictionGrade: 'A+' | 'A' | 'B+' | 'B';
  hitRateL10: { hits: number; total: number; pct: number };
  l10Logs: Array<{ game: string; opponent: string; value: number; line: number; hit: boolean }>;
  projectionCushion: number;
  keyDrivers: string[];
}
