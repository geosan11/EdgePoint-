import { createClient } from '@supabase/supabase-js';
import {
  CommunityPost,
  CuratedParlay,
  DeepAnalytics,
  LeagueTrendInsight,
  LineMovement,
  MatchFixture,
  Prediction,
  Sport,
  TipsterProfile,
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

// ========================================================
// Verified Tipster Marketplace & Creator Profiles
// ========================================================

export const MOCK_TIPSTERS: TipsterProfile[] = [
  {
    id: 'tipster-1',
    username: 'SharpShooter',
    displayName: 'Marcus Vance',
    avatar: '🎯',
    badge: 'verified_sharp',
    bio: 'Quantitative NBA pace & usage specialist. Only bet props with ≥ 4% model edge against Pinnacle fair lines.',
    specialty: 'NBA Player Props 🏀',
    winRate: 68.4,
    roiPct: 22.4,
    unitsWon: 34.5,
    clvPct: 4.2,
    subscribersCount: 142,
    monthlyPriceUSD: 10,
    monthlyPriceNGN: 3500,
    recentStreak: '🔥 5-0 L5',
    isVerified: true,
  },
  {
    id: 'tipster-2',
    username: 'EPLTactician',
    displayName: 'Liam Davies',
    avatar: '⚽',
    badge: 'pro_capper',
    bio: 'Bivariate Poisson match total & BTTS modeler. Exploiting retail bookmaker latency on early Premier League lines.',
    specialty: 'EPL Match Totals & BTTS ⚽',
    winRate: 64.2,
    roiPct: 18.7,
    unitsWon: 28.1,
    clvPct: 3.8,
    subscribersCount: 98,
    monthlyPriceUSD: 8,
    monthlyPriceNGN: 3000,
    recentStreak: '🔥 4-1 L5',
    isVerified: true,
  },
  {
    id: 'tipster-3',
    username: 'SynergyPicks',
    displayName: 'PointBlank Algo',
    avatar: '⚡',
    badge: 'algo_model',
    bio: 'Cross-league correlation engine generating synergistic daily 2-leg anchors with verified positive joint EV.',
    specialty: 'Algorithmic Parlays ⚡',
    winRate: 61.8,
    roiPct: 25.6,
    unitsWon: 41.0,
    clvPct: 4.8,
    subscribersCount: 215,
    monthlyPriceUSD: 15,
    monthlyPriceNGN: 5000,
    recentStreak: '🔥 7-2 L10',
    isVerified: true,
  },
];

// ========================================================
// Community & News Feed Posts
// ========================================================

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorId: 'tipster-1',
    authorName: 'Marcus Vance',
    authorUsername: 'SharpShooter',
    authorBadge: 'verified_sharp',
    authorWinRate: 68.4,
    authorRoi: 22.4,
    createdAt: '15m ago',
    type: 'prediction',
    league: 'NBA',
    title: 'Stephen Curry Over 26.5 PTS vs Lakers',
    content:
      'Lakers allow the 4th highest 3PA to opposing primary ballhandlers. Curry has cleared 26.5 in 7 of his last 10 games with 31.8% usage. Our pace projection of 102.5 possessions gives +3.3 PTS cushion.',
    isVip: false,
    predictionData: {
      fixture: 'Warriors @ Lakers',
      prop: 'Player Points',
      selection: 'Over',
      line: 26.5,
      odds: 1.95,
      units: 1.5,
      bookmaker: 'DraftKings',
      modelProb: 0.58,
    },
    tailCount: 42,
    fadeCount: 3,
    commentsCount: 11,
  },
  {
    id: 'post-2',
    authorId: 'tipster-1',
    authorName: 'Marcus Vance',
    authorUsername: 'SharpShooter',
    authorBadge: 'verified_sharp',
    authorWinRate: 68.4,
    authorRoi: 22.4,
    createdAt: '45m ago',
    type: 'prediction',
    league: 'NBA',
    title: '💎 HIGH CONVICTION VIP: Tatum Rebounds Line Misprice',
    content:
      'Knicks are playing small with Robinson out. Tatum is averaging 9.8 rebounds in his last 5 against top-8 defenses, and Pinnacle has already steam-shifted this line down to 1.78 while Bet365 is sleeping at 1.95.',
    isVip: true,
    predictionData: {
      fixture: 'Celtics @ Knicks',
      prop: 'Player Rebounds',
      selection: 'Over',
      line: 8.5,
      odds: 1.95,
      units: 2.0,
      bookmaker: 'Bet365',
      modelProb: 0.62,
    },
    tailCount: 68,
    fadeCount: 2,
    commentsCount: 19,
  },
  {
    id: 'post-3',
    authorId: 'tipster-2',
    authorName: 'Liam Davies',
    authorUsername: 'EPLTactician',
    authorBadge: 'pro_capper',
    authorWinRate: 64.2,
    authorRoi: 18.7,
    createdAt: '1h ago',
    type: 'news',
    league: 'Premier League',
    title: 'Tactical Alert: Chelsea Playing High Line vs Saka & Havertz',
    content:
      'Pre-match team sheets reveal Chelsea starting with an aggressive front foot 4-3-3. Our model expectancy for Arsenal counters jumps from 1.45 xG to 1.95 xG. Over 2.5 match total is prime value.',
    newsCategory: 'tactical',
    isVip: false,
    tailCount: 29,
    fadeCount: 4,
    commentsCount: 7,
  },
  {
    id: 'post-4',
    authorId: 'tipster-2',
    authorName: 'Liam Davies',
    authorUsername: 'EPLTactician',
    authorBadge: 'pro_capper',
    authorWinRate: 64.2,
    authorRoi: 18.7,
    createdAt: '2h ago',
    type: 'prediction',
    league: 'Premier League',
    title: 'VIP Syndicate Play: Man City vs Liverpool BTTS (Yes)',
    content:
      'Bivariate Poisson matrix yields 68.4% joint probability. Both teams have scored in 6 straight Etihad encounters with a combined 3.42 xG expectancy.',
    isVip: true,
    predictionData: {
      fixture: 'Man City vs Liverpool',
      prop: 'BTTS',
      selection: 'Yes',
      odds: 1.68,
      units: 2.0,
      bookmaker: 'SportyBet',
      modelProb: 0.684,
    },
    tailCount: 54,
    fadeCount: 5,
    commentsCount: 14,
  },
  {
    id: 'post-5',
    authorId: 'tipster-1',
    authorName: 'Marcus Vance',
    authorUsername: 'SharpShooter',
    authorBadge: 'verified_sharp',
    authorWinRate: 68.4,
    authorRoi: 22.4,
    createdAt: '3h ago',
    type: 'news',
    league: 'NBA',
    title: '🚨 Injury Update: Draymond Green Upgraded to Play',
    content:
      'Warriors defensive efficiency rating improves by +6.2 points per 100 possessions when Green is on court. Expect Lakers paint scoring efficiency to decrease.',
    newsCategory: 'injury',
    isVip: false,
    tailCount: 38,
    fadeCount: 1,
    commentsCount: 9,
  },
];

// ========================================================
// Deep Dive Selection Analytics Database
// ========================================================

export const MOCK_DEEP_ANALYTICS: Record<string, DeepAnalytics> = {
  'pred-1': {
    predictionId: 'pred-1',
    convictionGrade: 'A+',
    hitRateL10: { hits: 7, total: 10, pct: 70 },
    l10Logs: [
      { game: 'vs DEN', opponent: 'Nuggets', value: 32, line: 26.5, hit: true },
      { game: '@ PHX', opponent: 'Suns', value: 28, line: 26.5, hit: true },
      { game: '@ SAC', opponent: 'Kings', value: 24, line: 26.5, hit: false },
      { game: 'vs DAL', opponent: 'Mavericks', value: 31, line: 26.5, hit: true },
      { game: 'vs HOU', opponent: 'Rockets', value: 29, line: 26.5, hit: true },
      { game: '@ UTA', opponent: 'Jazz', value: 27, line: 26.5, hit: true },
      { game: '@ LAC', opponent: 'Clippers', value: 21, line: 26.5, hit: false },
      { game: 'vs MEM', opponent: 'Grizzlies', value: 35, line: 26.5, hit: true },
      { game: 'vs OKC', opponent: 'Thunder', value: 26, line: 26.5, hit: false },
      { game: '@ POR', opponent: 'Blazers', value: 30, line: 26.5, hit: true },
    ],
    projectionCushion: 3.3,
    keyDrivers: [
      'Pace Surge: Projected 102.5 possessions (+4.3 vs league avg, generating ~6 additional shot attempts)',
      'Defensive Vulnerability: Lakers rank #22 in league defending point guard 3-point pullups',
      'Usage Rate Dominance: 31.8% usage rate in L5 games without Paul on court',
      'True Fair Line: Pinnacle devigged fair odds at 1.72 vs DraftKings retail misprice at 1.95',
    ],
  },
  'pred-2': {
    predictionId: 'pred-2',
    convictionGrade: 'A+',
    hitRateL10: { hits: 8, total: 10, pct: 80 },
    l10Logs: [
      { game: 'vs MCI', opponent: 'Man City', value: 3.8, line: 2.5, hit: true },
      { game: '@ NEW', opponent: 'Newcastle', value: 2.9, line: 2.5, hit: true },
      { game: 'vs SHU', opponent: 'Sheffield', value: 4.1, line: 2.5, hit: true },
      { game: '@ AVL', opponent: 'Aston Villa', value: 1.8, line: 2.5, hit: false },
      { game: 'vs TOT', opponent: 'Tottenham', value: 3.5, line: 2.5, hit: true },
      { game: '@ LIV', opponent: 'Liverpool', value: 3.2, line: 2.5, hit: true },
      { game: 'vs WHU', opponent: 'West Ham', value: 2.7, line: 2.5, hit: true },
      { game: '@ MUN', opponent: 'Man United', value: 3.0, line: 2.5, hit: true },
      { game: 'vs BHA', opponent: 'Brighton', value: 1.9, line: 2.5, hit: false },
      { game: '@ EVE', opponent: 'Everton', value: 3.1, line: 2.5, hit: true },
    ],
    projectionCushion: 0.65,
    keyDrivers: [
      'Bivariate Poisson Matrix: 61.0% joint probability for Over 2.5 goals',
      'Combined xG Expectancy: 3.30 expected goals across both clubs (Arsenal 1.95 xG, Chelsea 1.35 xG)',
      'Transition Tempo: Chelsea concede 2.1 big chances per away match',
      'Model Edge: +16.5% mathematical EV against Bet365 1.91 price',
    ],
  },
  'pred-3': {
    predictionId: 'pred-3',
    convictionGrade: 'A',
    hitRateL10: { hits: 7, total: 10, pct: 70 },
    l10Logs: [
      { game: 'vs MIA', opponent: 'Heat', value: 31, line: 27.5, hit: true },
      { game: '@ IND', opponent: 'Pacers', value: 34, line: 27.5, hit: true },
      { game: 'vs MIL', opponent: 'Bucks', value: 25, line: 27.5, hit: false },
      { game: 'vs PHI', opponent: '76ers', value: 29, line: 27.5, hit: true },
      { game: '@ CLE', opponent: 'Cavaliers', value: 28, line: 27.5, hit: true },
      { game: 'vs ORL', opponent: 'Magic', value: 23, line: 27.5, hit: false },
      { game: '@ BKN', opponent: 'Nets', value: 32, line: 27.5, hit: true },
      { game: 'vs CHI', opponent: 'Bulls', value: 33, line: 27.5, hit: true },
      { game: '@ TOR', opponent: 'Raptors', value: 26, line: 27.5, hit: false },
      { game: 'vs ATL', opponent: 'Hawks', value: 30, line: 27.5, hit: true },
    ],
    projectionCushion: 3.1,
    keyDrivers: [
      'Pace-Adjusted Baseline: 30.6 projected points against 27.5 line',
      'Isolation Efficiency: 1.18 points per possession in Madison Square Garden matchups',
      'Form Trend: L3 average of 31.3 points on 22.4 field goal attempts',
      'True Fair Line: 1.68 zero-vig fair odds vs 1.92 Pinnacle line',
    ],
  },
};

export async function getTipsters(): Promise<TipsterProfile[]> {
  return MOCK_TIPSTERS;
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  return MOCK_COMMUNITY_POSTS;
}

export function getDeepAnalytics(predictionId: string): DeepAnalytics {
  if (MOCK_DEEP_ANALYTICS[predictionId]) {
    return MOCK_DEEP_ANALYTICS[predictionId];
  }
  // Generic fallback for any other prediction
  return {
    predictionId,
    convictionGrade: 'A',
    hitRateL10: { hits: 6, total: 10, pct: 60 },
    l10Logs: [
      { game: 'L1', opponent: 'Opp 1', value: 28, line: 25.5, hit: true },
      { game: 'L2', opponent: 'Opp 2', value: 24, line: 25.5, hit: false },
      { game: 'L3', opponent: 'Opp 3', value: 27, line: 25.5, hit: true },
      { game: 'L4', opponent: 'Opp 4', value: 29, line: 25.5, hit: true },
      { game: 'L5', opponent: 'Opp 5', value: 23, line: 25.5, hit: false },
      { game: 'L6', opponent: 'Opp 6', value: 31, line: 25.5, hit: true },
      { game: 'L7', opponent: 'Opp 7', value: 26, line: 25.5, hit: true },
      { game: 'L8', opponent: 'Opp 8', value: 22, line: 25.5, hit: false },
      { game: 'L9', opponent: 'Opp 9', value: 28, line: 25.5, hit: true },
      { game: 'L10', opponent: 'Opp 10', value: 21, line: 25.5, hit: false },
    ],
    projectionCushion: 2.1,
    keyDrivers: [
      'Model Edge: Positive expected value detected against bookmaker margin',
      'Form Factor: Consistency in recent rolling slate performances',
      'Vig Discrepancy: Retail odds are trading wider than market maker baseline',
    ],
  };
}
