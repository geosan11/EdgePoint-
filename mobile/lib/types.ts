export type Sport = 'basketball' | 'football';

export type MarketType =
  | 'player_points'
  | 'player_rebounds'
  | 'player_assists'
  | 'pra_combo'
  | 'match_total'
  | 'spread'
  | 'btts';

export type Tier = 'free' | 'pro';

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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  subscriptionTier: 'free' | 'edgepoint_pro';
  subscriptionStatus: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd?: string;
  bankroll: number;
  unitSize: number;
}
