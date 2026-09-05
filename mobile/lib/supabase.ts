import { createClient } from '@supabase/supabase-js';
import { CuratedParlay, LineMovement, Prediction, UserProfile } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ========================================================
// Realistic Mock Fallback Datasets (Immediate offline test)
// ========================================================

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    fixture_id: 'nba_lal_gsw',
    sport: 'basketball',
    league_id: 'basketball_nba',
    league_name: 'NBA',
    market_type: 'player_points',
    player_name: 'Stephen Curry',
    team_name: 'Golden State Warriors',
    match_title: 'Warriors @ Lakers',
    selection: 'Over',
    line: 26.5,
    best_bookmaker: 'DraftKings',
    sportsbook_odds: 1.95,
    american_odds: -105,
    implied_probability: 0.5128,
    fair_odds: 1.724,
    model_probability: 0.58,
    model_projected_stat: 29.8,
    edge_delta: 3.3,
    ev_percentage: 13.1,
    edge_score: 84.5,
    recommended_units: 1.5,
    tier: 'free', // Free teaser pick
    status: 'pending',
    commence_time: 'Tonight, 10:30 PM ET',
    analysis_notes: {
      l3_avg: 31.0,
      l5_avg: 29.4,
      l10_avg: 28.2,
      opp_def_rank: 22,
      game_pace: 102.5,
    },
  },
  {
    id: 'pred-2',
    fixture_id: 'cba_gua_lia',
    sport: 'basketball',
    league_id: 'basketball_cba',
    league_name: 'CBA China',
    market_type: 'player_assists',
    player_name: 'Tremont Waters',
    team_name: 'Guangdong Southern Tigers',
    match_title: 'Guangdong vs Liaoning',
    selection: 'Over',
    line: 8.5,
    best_bookmaker: '1xBet',
    sportsbook_odds: 2.10,
    american_odds: 110,
    implied_probability: 0.4762,
    fair_odds: 1.695,
    model_probability: 0.59,
    model_projected_stat: 10.4,
    edge_delta: 1.9,
    ev_percentage: 23.9,
    edge_score: 92.0,
    recommended_units: 2.0,
    tier: 'pro', // EdgePoint+ Pro Exclusive
    status: 'pending',
    commence_time: 'Tomorrow, 7:35 AM ET',
    analysis_notes: {
      l3_avg: 11.3,
      l5_avg: 10.2,
      opp_def_rank: 25,
      game_pace: 105.0,
    },
  },
  {
    id: 'pred-3',
    fixture_id: 'epl_ars_che',
    sport: 'football',
    league_id: 'soccer_epl',
    league_name: 'Premier League',
    market_type: 'match_total',
    match_title: 'Arsenal vs Chelsea',
    selection: 'Over',
    line: 2.5,
    best_bookmaker: 'Bet365',
    sportsbook_odds: 1.91,
    american_odds: -110,
    implied_probability: 0.5236,
    fair_odds: 1.639,
    model_probability: 0.61,
    model_projected_stat: 3.15,
    edge_delta: 0.65,
    ev_percentage: 16.5,
    edge_score: 88.0,
    recommended_units: 1.75,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Saturday, 12:30 PM ET',
    analysis_notes: {
      home_xg: 1.95,
      away_xg: 1.35,
      combined_xg: 3.3,
    },
  },
  {
    id: 'pred-4',
    fixture_id: 'nba_bos_mil',
    sport: 'basketball',
    league_id: 'basketball_nba',
    league_name: 'NBA',
    market_type: 'pra_combo',
    player_name: 'Giannis Antetokounmpo',
    team_name: 'Milwaukee Bucks',
    match_title: 'Bucks @ Celtics',
    selection: 'Over',
    line: 47.5,
    best_bookmaker: 'Pinnacle',
    sportsbook_odds: 1.88,
    american_odds: -114,
    implied_probability: 0.5319,
    fair_odds: 1.68,
    model_probability: 0.595,
    model_projected_stat: 51.2,
    edge_delta: 3.7,
    ev_percentage: 11.9,
    edge_score: 81.0,
    recommended_units: 1.25,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Sunday, 8:00 PM ET',
    analysis_notes: {
      l3_avg: 54.0,
      l5_avg: 50.8,
      opp_def_rank: 14,
    },
  },
  {
    id: 'pred-5',
    fixture_id: 'epl_mci_liv',
    sport: 'football',
    league_id: 'soccer_epl',
    league_name: 'Premier League',
    market_type: 'btts',
    match_title: 'Man City vs Liverpool',
    selection: 'Yes',
    line: 0.5,
    best_bookmaker: 'SportyBet',
    sportsbook_odds: 1.75,
    american_odds: -133,
    implied_probability: 0.5714,
    fair_odds: 1.493,
    model_probability: 0.67,
    model_projected_stat: 1.0,
    edge_delta: 0.5,
    ev_percentage: 17.3,
    edge_score: 89.5,
    recommended_units: 2.0,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Sunday, 11:30 AM ET',
    analysis_notes: {
      home_scoring_prob: 0.84,
      away_scoring_prob: 0.79,
    },
  },
];

export const MOCK_DAILY_SLIP: CuratedParlay = {
  id: 'daily-slip-01',
  title: 'PointBlank: Global Cross-League Slate',
  slate_date: new Date().toISOString().split('T')[0],
  legs: [
    {
      prediction_id: 'pred-2',
      fixture: 'Guangdong vs Liaoning (CBA)',
      prop: 'Tremont Waters Over 8.5 Ast',
      selection: 'Over',
      odds: 2.10,
      ev: '+23.9% EV',
      bookmaker: '1xBet',
      edge_score: 92.0,
    },
    {
      prediction_id: 'pred-3',
      fixture: 'Arsenal vs Chelsea (EPL)',
      prop: 'Over 2.5 Total Goals',
      selection: 'Over',
      odds: 1.91,
      ev: '+16.5% EV',
      bookmaker: 'Bet365',
      edge_score: 88.0,
    },
    {
      prediction_id: 'pred-1',
      fixture: 'Warriors @ Lakers (NBA)',
      prop: 'Stephen Curry Over 26.5 Pts',
      selection: 'Over',
      odds: 1.95,
      ev: '+13.1% EV',
      bookmaker: 'DraftKings',
      edge_score: 84.5,
    },
  ],
  total_sportsbook_odds: 7.82,
  total_fair_odds: 4.86,
  model_win_probability: 0.214,
  combined_ev_percentage: 38.4,
  correlation_score: 1.18,
  recommended_units: 0.5,
  tier: 'pro',
  status: 'pending',
  summary_analysis:
    'Synergistic multi-sport parlay: Morning CBA transition pace flows into an offensive London derby, capped with high-possession NBA late night. High +EV across all three staggered legs.',
};

export const MOCK_RADAR_MOVEMENTS: LineMovement[] = [
  {
    id: 'radar-1',
    fixture_id: 'nba_lal_gsw',
    match_title: 'Warriors @ Lakers',
    sport: 'basketball',
    market_key: 'spreads',
    selection: 'Golden State Warriors -3.5',
    opening_odds: 1.95,
    current_odds: 1.80,
    opening_line: -2.5,
    current_line: -4.0,
    steam_direction: 'shortening',
    sharp_book: 'Pinnacle',
    divergent_book: 'SportyBet',
    divergence_percentage: 8.33,
    alert_type: 'steam_move',
    created_at: '12m ago',
  },
  {
    id: 'radar-2',
    fixture_id: 'epl_ars_che',
    match_title: 'Arsenal vs Chelsea',
    sport: 'football',
    market_key: 'totals',
    selection: 'Over 2.5 Goals',
    opening_odds: 2.05,
    current_odds: 1.88,
    opening_line: 2.5,
    current_line: 2.5,
    steam_direction: 'shortening',
    sharp_book: 'Pinnacle',
    divergent_book: 'Bet365',
    divergence_percentage: 9.04,
    alert_type: 'reverse_line_movement',
    created_at: '34m ago',
  },
  {
    id: 'radar-3',
    fixture_id: 'cba_gua_lia',
    match_title: 'Guangdong vs Liaoning',
    sport: 'basketball',
    market_key: 'player_assists',
    selection: 'Tremont Waters Over 8.5',
    opening_odds: 2.10,
    current_odds: 1.89,
    opening_line: 8.5,
    current_line: 9.5,
    steam_direction: 'line_shift',
    sharp_book: 'Pinnacle',
    divergent_book: '1xBet',
    divergence_percentage: 11.11,
    alert_type: 'off_market_line',
    created_at: '1h ago',
  },
];

// Data service helpers with automatic fallback
export async function getPredictions(sportFilter?: string): Promise<Prediction[]> {
  try {
    let query = supabase.from('model_predictions').select('*').order('edge_score', { ascending: false });
    if (sportFilter && sportFilter !== 'all') {
      query = query.eq('sport', sportFilter);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return sportFilter && sportFilter !== 'all'
        ? MOCK_PREDICTIONS.filter((p) => p.sport === sportFilter)
        : MOCK_PREDICTIONS;
    }
    return data as Prediction[];
  } catch {
    return sportFilter && sportFilter !== 'all'
      ? MOCK_PREDICTIONS.filter((p) => p.sport === sportFilter)
      : MOCK_PREDICTIONS;
  }
}

export async function getDailySlip(): Promise<CuratedParlay> {
  try {
    const { data, error } = await supabase.from('curated_parlays').select('*').limit(1).single();
    if (error || !data) return MOCK_DAILY_SLIP;
    return data as CuratedParlay;
  } catch {
    return MOCK_DAILY_SLIP;
  }
}

export async function getLineMovements(): Promise<LineMovement[]> {
  try {
    const { data, error } = await supabase.from('line_movements').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return MOCK_RADAR_MOVEMENTS;
    return data as LineMovement[];
  } catch {
    return MOCK_RADAR_MOVEMENTS;
  }
}
