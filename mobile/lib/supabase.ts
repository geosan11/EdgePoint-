import { createClient } from '@supabase/supabase-js';
import {
  CuratedParlay,
  LeagueTrendInsight,
  LineMovement,
  MatchFixture,
  Prediction,
  Sport,
} from './types';

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
// Active 2026/2027 NBA & Premier League Slates
// ========================================================

export const MOCK_FIXTURES: MatchFixture[] = [
  {
    id: 'fix-nba-1',
    sport: 'basketball',
    league: 'NBA',
    awayTeam: 'Golden State Warriors',
    homeTeam: 'Los Angeles Lakers',
    awayScore: 84,
    homeScore: 88,
    status: 'live',
    gameClock: 'Q3 5:12',
    commenceTime: 'Tonight, 10:30 PM ET',
    stadium: 'Crypto.com Arena',
    markets: {
      spread: { line: -3.5, homeOdds: 1.91, awayOdds: 1.95, bestBook: 'Pinnacle' },
      total: { line: 226.5, overOdds: 1.93, underOdds: 1.93, bestBook: 'DraftKings' },
      moneyline: { home: 1.67, away: 2.25, bestBook: 'Bet365' },
    },
    modelEdge: {
      market: 'Total',
      pick: 'Over 226.5',
      edgePct: 5.4,
      modelProb: 0.548,
    },
  },
  {
    id: 'fix-epl-1',
    sport: 'football',
    league: 'Premier League',
    awayTeam: 'Chelsea',
    homeTeam: 'Arsenal',
    awayScore: 1,
    homeScore: 2,
    status: 'live',
    gameClock: "72'",
    commenceTime: 'Today, 12:30 PM ET',
    stadium: 'Emirates Stadium',
    markets: {
      total: { line: 2.5, overOdds: 1.91, underOdds: 1.95, bestBook: 'Bet365' },
      moneyline: { home: 1.85, away: 4.20, draw: 3.75, bestBook: 'SportyBet' },
    },
    modelEdge: {
      market: 'Total',
      pick: 'Over 2.5',
      edgePct: 7.2,
      modelProb: 0.612,
    },
  },
  {
    id: 'fix-nba-2',
    sport: 'basketball',
    league: 'NBA',
    awayTeam: 'Boston Celtics',
    homeTeam: 'New York Knicks',
    status: 'upcoming',
    commenceTime: 'Tonight, 7:30 PM ET',
    stadium: 'Madison Square Garden',
    markets: {
      spread: { line: -4.5, homeOdds: 1.95, awayOdds: 1.91, bestBook: 'Pinnacle' },
      total: { line: 221.0, overOdds: 1.90, underOdds: 1.96, bestBook: 'FanDuel' },
      moneyline: { home: 2.45, away: 1.58, bestBook: 'SportyBet' },
    },
    modelEdge: {
      market: 'Spread',
      pick: 'Celtics -4.5',
      edgePct: 4.8,
      modelProb: 0.551,
    },
  },
  {
    id: 'fix-epl-2',
    sport: 'football',
    league: 'Premier League',
    awayTeam: 'Liverpool',
    homeTeam: 'Manchester City',
    status: 'upcoming',
    commenceTime: 'Tomorrow, 11:30 AM ET',
    stadium: 'Etihad Stadium',
    markets: {
      total: { line: 3.0, overOdds: 1.88, underOdds: 2.02, bestBook: 'Pinnacle' },
      moneyline: { home: 2.05, away: 3.40, draw: 3.80, bestBook: 'Bet365' },
    },
    modelEdge: {
      market: 'BTTS',
      pick: 'Both Teams to Score (Yes)',
      edgePct: 8.6,
      modelProb: 0.684,
    },
  },
  {
    id: 'fix-nba-3',
    sport: 'basketball',
    league: 'NBA',
    awayTeam: 'Denver Nuggets',
    homeTeam: 'Oklahoma City Thunder',
    status: 'upcoming',
    commenceTime: 'Tomorrow, 9:00 PM ET',
    stadium: 'Paycom Center',
    markets: {
      spread: { line: -2.5, homeOdds: 1.91, awayOdds: 1.95, bestBook: 'Pinnacle' },
      total: { line: 228.5, overOdds: 1.95, underOdds: 1.91, bestBook: 'DraftKings' },
      moneyline: { home: 1.78, away: 2.10, bestBook: 'SportyBet' },
    },
    modelEdge: {
      market: 'Moneyline',
      pick: 'Nuggets ML',
      edgePct: 6.1,
      modelProb: 0.518,
    },
  },
];

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: 'pred-1',
    fixture_id: 'fix-nba-1',
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
    edge_score: 86.5,
    recommended_units: 1.5,
    tier: 'free',
    status: 'pending',
    commence_time: 'Tonight, 10:30 PM ET',
    analysis_notes: {
      l5_avg: 29.4,
      opp_def_rank: 22,
      game_pace: 102.5,
      usage_rate: 31.8,
    },
  },
  {
    id: 'pred-2',
    fixture_id: 'fix-epl-1',
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
    edge_score: 89.0,
    recommended_units: 1.75,
    tier: 'free',
    status: 'pending',
    commence_time: 'Today, 12:30 PM ET',
    analysis_notes: {
      combined_xg: 3.3,
      home_xg: 1.95,
      away_xg: 1.35,
    },
  },
  {
    id: 'pred-3',
    fixture_id: 'fix-nba-2',
    sport: 'basketball',
    league_id: 'basketball_nba',
    league_name: 'NBA',
    market_type: 'player_points',
    player_name: 'Jayson Tatum',
    team_name: 'Boston Celtics',
    match_title: 'Celtics @ Knicks',
    selection: 'Over',
    line: 27.5,
    best_bookmaker: 'Pinnacle',
    sportsbook_odds: 1.92,
    american_odds: -109,
    implied_probability: 0.5208,
    fair_odds: 1.68,
    model_probability: 0.595,
    model_projected_stat: 30.6,
    edge_delta: 3.1,
    ev_percentage: 14.2,
    edge_score: 87.0,
    recommended_units: 1.5,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Tonight, 7:30 PM ET',
    analysis_notes: {
      l5_avg: 31.2,
      opp_def_rank: 18,
      game_pace: 99.8,
    },
  },
  {
    id: 'pred-4',
    fixture_id: 'fix-epl-2',
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
    fair_odds: 1.49,
    model_probability: 0.671,
    model_projected_stat: 1.0,
    edge_delta: 0.5,
    ev_percentage: 17.3,
    edge_score: 91.5,
    recommended_units: 2.0,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Tomorrow, 11:30 AM ET',
    analysis_notes: {
      home_scoring_prob: 0.86,
      away_scoring_prob: 0.81,
    },
  },
  {
    id: 'pred-5',
    fixture_id: 'fix-nba-3',
    sport: 'basketball',
    league_id: 'basketball_nba',
    league_name: 'NBA',
    market_type: 'pra_combo',
    player_name: 'Nikola Jokic',
    team_name: 'Denver Nuggets',
    match_title: 'Nuggets @ Thunder',
    selection: 'Over',
    line: 48.5,
    best_bookmaker: 'DraftKings',
    sportsbook_odds: 1.88,
    american_odds: -114,
    implied_probability: 0.5319,
    fair_odds: 1.62,
    model_probability: 0.617,
    model_projected_stat: 52.4,
    edge_delta: 3.9,
    ev_percentage: 16.0,
    edge_score: 88.5,
    recommended_units: 1.75,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Tomorrow, 9:00 PM ET',
    analysis_notes: {
      l5_avg: 51.6,
      opp_def_rank: 8,
      usage_rate: 33.2,
    },
  },
  {
    id: 'pred-6',
    fixture_id: 'fix-epl-2',
    sport: 'football',
    league_id: 'soccer_epl',
    league_name: 'Premier League',
    market_type: 'shots_on_target',
    player_name: 'Erling Haaland',
    team_name: 'Manchester City',
    match_title: 'Man City vs Liverpool',
    selection: 'Over',
    line: 1.5,
    best_bookmaker: 'Bet365',
    sportsbook_odds: 1.85,
    american_odds: -118,
    implied_probability: 0.5405,
    fair_odds: 1.58,
    model_probability: 0.633,
    model_projected_stat: 2.3,
    edge_delta: 0.8,
    ev_percentage: 17.1,
    edge_score: 89.5,
    recommended_units: 1.75,
    tier: 'pro',
    status: 'pending',
    commence_time: 'Tomorrow, 11:30 AM ET',
    analysis_notes: {
      l5_avg: 2.6,
      box_touches_p90: 8.4,
    },
  },
];

export const MOCK_DAILY_SLIP: CuratedParlay = {
  id: 'daily-slip-01',
  title: 'PointBlank: NBA & EPL Synergy Ticket',
  slate_date: new Date().toISOString().split('T')[0],
  legs: [
    {
      prediction_id: 'pred-2',
      fixture: 'Arsenal vs Chelsea (EPL)',
      prop: 'Over 2.5 Total Goals',
      selection: 'Over',
      odds: 1.91,
      ev: '+16.5% EV',
      bookmaker: 'Bet365',
      edge_score: 89.0,
    },
    {
      prediction_id: 'pred-1',
      fixture: 'Warriors @ Lakers (NBA)',
      prop: 'Stephen Curry Over 26.5 Pts',
      selection: 'Over',
      odds: 1.95,
      ev: '+13.1% EV',
      bookmaker: 'DraftKings',
      edge_score: 86.5,
    },
    {
      prediction_id: 'pred-4',
      fixture: 'Man City vs Liverpool (EPL)',
      prop: 'Both Teams To Score (Yes)',
      selection: 'Yes',
      odds: 1.75,
      ev: '+17.3% EV',
      bookmaker: 'SportyBet',
      edge_score: 91.5,
    },
  ],
  total_sportsbook_odds: 6.52,
  total_fair_odds: 4.12,
  model_win_probability: 0.243,
  combined_ev_percentage: 42.1,
  correlation_score: 1.15,
  recommended_units: 0.75,
  tier: 'pro',
  status: 'pending',
  summary_analysis:
    'Synergistic slate combining morning Premier League goal expectation with late-night NBA fast-break pace. Staggered kickoff schedule enables real-time position tracking.',
};

export const MOCK_RADAR_MOVEMENTS: LineMovement[] = [
  {
    id: 'radar-1',
    fixture_id: 'fix-nba-1',
    match_title: 'Warriors @ Lakers',
    sport: 'basketball',
    market_key: 'spreads',
    selection: 'Golden State Warriors -3.5',
    opening_odds: 1.95,
    current_odds: 1.80,
    opening_line: -2.0,
    current_line: -3.5,
    steam_direction: 'shortening',
    sharp_book: 'Pinnacle',
    divergent_book: 'SportyBet',
    divergence_percentage: 8.33,
    alert_type: 'steam_move',
    created_at: '14m ago',
  },
  {
    id: 'radar-2',
    fixture_id: 'fix-epl-1',
    match_title: 'Arsenal vs Chelsea',
    sport: 'football',
    market_key: 'totals',
    selection: 'Over 2.5 Goals',
    opening_odds: 2.05,
    current_odds: 1.91,
    opening_line: 2.5,
    current_line: 2.5,
    steam_direction: 'shortening',
    sharp_book: 'Pinnacle',
    divergent_book: 'Bet365',
    divergence_percentage: 9.04,
    alert_type: 'reverse_line_movement',
    created_at: '28m ago',
  },
  {
    id: 'radar-3',
    fixture_id: 'fix-nba-3',
    match_title: 'Nuggets @ Thunder',
    sport: 'basketball',
    market_key: 'totals',
    selection: 'Over 228.5 Total Points',
    opening_odds: 1.92,
    current_odds: 1.79,
    opening_line: 226.5,
    current_line: 228.5,
    steam_direction: 'line_shift',
    sharp_book: 'Pinnacle',
    divergent_book: 'Bet9ja',
    divergence_percentage: 7.26,
    alert_type: 'off_market_line',
    created_at: '1h ago',
  },
];

export const MOCK_INSIGHTS: LeagueTrendInsight[] = [
  {
    id: 'ins-1',
    sport: 'basketball',
    league: 'NBA',
    title: 'Warriors High-Pace Road Splits',
    subtitle: 'Golden State offensive rating jumps +4.8 pts in road games against bottom-10 defenses.',
    stat: '118.4',
    statLabel: 'OFF RTG (L5)',
    trend: 'positive',
    description: 'Pace correlation heavily favors Over totals and perimeter shooter volume.',
  },
  {
    id: 'ins-2',
    sport: 'football',
    league: 'Premier League',
    title: 'Emirates Derby Over 2.5 Trend',
    subtitle: '7 of the last 8 London Derbies at the Emirates have cleared 2.5 total match goals.',
    stat: '87.5%',
    statLabel: 'OVER 2.5 HIT RATE',
    trend: 'positive',
    description: 'Average combined xG in this fixture is 3.18, beating bookmaker pricing of 2.5 flat.',
  },
  {
    id: 'ins-3',
    sport: 'basketball',
    league: 'NBA',
    title: 'Celtics Perimeter Defense Efficiency',
    subtitle: 'Boston holding opponents to 31.4% from beyond the arc over opening 6 games.',
    stat: '#1 NBA',
    statLabel: 'DEF 3PT%',
    trend: 'neutral',
    description: 'Suppresses opposing guard scoring props; value leans towards under lines.',
  },
  {
    id: 'ins-4',
    sport: 'football',
    league: 'Premier League',
    title: 'Man City vs Top-6 BTTS Reliability',
    subtitle: 'Both teams have scored in 11 of Man City’s last 13 matches against top-6 opponents.',
    stat: '84.6%',
    statLabel: 'BTTS HIT RATE',
    trend: 'positive',
    description: 'High line security when matched against direct title contenders.',
  },
];

// Data service helpers with automatic fallback
export async function getFixtures(sportFilter?: Sport | 'all'): Promise<MatchFixture[]> {
  try {
    const { data, error } = await supabase.from('fixtures').select('*');
    if (error || !data || data.length === 0) {
      return sportFilter && sportFilter !== 'all'
        ? MOCK_FIXTURES.filter((f) => f.sport === sportFilter)
        : MOCK_FIXTURES;
    }
    return data as MatchFixture[];
  } catch {
    return sportFilter && sportFilter !== 'all'
      ? MOCK_FIXTURES.filter((f) => f.sport === sportFilter)
      : MOCK_FIXTURES;
  }
}

export async function getPredictions(sportFilter?: Sport | 'all'): Promise<Prediction[]> {
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

export async function getInsights(): Promise<LeagueTrendInsight[]> {
  return MOCK_INSIGHTS;
}
