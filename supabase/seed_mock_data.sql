-- EdgePoint+ Seed Mock Data
-- Migration: seed_mock_data.sql
-- Description: Realistic initial data for leagues, fixtures, and model predictions for immediate dev/test.

-- 1. Populate Leagues (Basketball & Football)
INSERT INTO public.sports_leagues (id, name, sport, region, active) VALUES
('basketball_nba', 'NBA', 'basketball', 'North America', true),
('basketball_euroleague', 'EuroLeague', 'basketball', 'Europe', true),
('basketball_cba', 'Chinese Basketball Association (CBA)', 'basketball', 'Asia', true),
('basketball_pba', 'Philippine Basketball Association (PBA)', 'basketball', 'Asia', true),
('basketball_nbl', 'NBL Australia', 'basketball', 'Oceania', true),
('soccer_epl', 'Premier League', 'football', 'Europe', true),
('soccer_uefa_champs_league', 'UEFA Champions League', 'football', 'Europe', true),
('soccer_spain_la_liga', 'La Liga', 'football', 'Europe', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Populate Upcoming Fixtures
INSERT INTO public.fixtures (id, sport, league_id, home_team, away_team, commence_time, status, venue) VALUES
-- Basketball Fixtures
('fix_nba_lal_gsw', 'basketball', 'basketball_nba', 'Los Angeles Lakers', 'Golden State Warriors', now() + interval '4 hours', 'scheduled', 'Crypto.com Arena'),
('fix_nba_bos_mil', 'basketball', 'basketball_nba', 'Boston Celtics', 'Milwaukee Bucks', now() + interval '6 hours', 'scheduled', 'TD Garden'),
('fix_euro_rma_bar', 'basketball', 'basketball_euroleague', 'Real Madrid Baloncesto', 'FC Barcelona Basquet', now() + interval '8 hours', 'scheduled', 'WiZink Center'),
('fix_cba_gua_lia', 'basketball', 'basketball_cba', 'Guangdong Southern Tigers', 'Liaoning Flying Leopards', now() + interval '12 hours', 'scheduled', 'Dongguan Basketball Center'),

-- Football Fixtures
('fix_epl_ars_che', 'football', 'soccer_epl', 'Arsenal', 'Chelsea', now() + interval '5 hours', 'scheduled', 'Emirates Stadium'),
('fix_epl_mci_liv', 'football', 'soccer_epl', 'Manchester City', 'Liverpool', now() + interval '24 hours', 'scheduled', 'Etihad Stadium'),
('fix_ucl_rm_bay', 'football', 'soccer_uefa_champs_league', 'Real Madrid', 'Bayern Munich', now() + interval '48 hours', 'scheduled', 'Santiago Bernabéu')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 3. Populate Model Predictions (+EV Edge Picks)
INSERT INTO public.model_predictions (
    fixture_id, sport, league_id, market_type, player_name, team_name, selection, line,
    best_bookmaker, sportsbook_odds, american_odds, implied_probability, fair_odds, model_probability,
    model_projected_stat, edge_delta, ev_percentage, edge_score, recommended_units, tier, status, analysis_notes,
    match_title, league_name, commence_time
) VALUES
-- Free Pick Teaser 1 (Basketball)
(
    'fix_nba_lal_gsw', 'basketball', 'basketball_nba', 'player_points', 'Stephen Curry', 'Golden State Warriors', 'Over', 26.5,
    'DraftKings', 1.95, -105, 0.5128, 1.724, 0.5800,
    29.80, 3.30, 13.10, 84.5, 1.50, 'free', 'pending',
    '{"rolling_form": {"L3": 31.0, "L5": 29.4, "L10": 28.2}, "opponent_def_rank": 22, "pace_factor": 102.4, "rest_days": 2}'::jsonb,
    'Golden State Warriors @ Los Angeles Lakers', 'NBA', now() + interval '4 hours'
),
-- Pro Pick 1 (Basketball - High Edge CBA)
(
    'fix_cba_gua_lia', 'basketball', 'basketball_cba', 'player_assists', 'Tremont Waters', 'Guangdong Southern Tigers', 'Over', 8.5,
    '1xBet', 2.10, 110, 0.4762, 1.695, 0.5900,
    10.40, 1.90, 23.90, 92.0, 2.00, 'pro', 'pending',
    '{"rolling_form": {"L3": 11.3, "L5": 10.2, "L10": 9.6}, "opponent_pace": 104.8, "usage_rate": 32.4}'::jsonb,
    'Guangdong Southern Tigers vs Liaoning Flying Leopards', 'Chinese Basketball Association (CBA)', now() + interval '12 hours'
),
-- Pro Pick 2 (Football - EPL xG Edge)
(
    'fix_epl_ars_che', 'football', 'soccer_epl', 'match_total', NULL, NULL, 'Over', 2.5,
    'Bet365', 1.91, -110, 0.5236, 1.639, 0.6100,
    3.15, 0.65, 16.51, 88.0, 1.75, 'pro', 'pending',
    '{"combined_xG": 3.24, "home_attack_rating": 1.92, "away_defense_rating": 1.32, "poisson_sims": 10000}'::jsonb,
    'Arsenal vs Chelsea', 'Premier League', now() + interval '5 hours'
),
-- Pro Pick 3 (Basketball - PRA Combo)
(
    'fix_nba_bos_mil', 'basketball', 'basketball_nba', 'pra_combo', 'Giannis Antetokounmpo', 'Milwaukee Bucks', 'Over', 47.5,
    'Pinnacle', 1.88, -114, 0.5319, 1.680, 0.5950,
    51.20, 3.70, 11.86, 81.0, 1.25, 'pro', 'pending',
    '{"rolling_form": {"L3": 54.0, "L5": 50.8, "L10": 49.1}, "paint_touch_rate": 14.2, "pace_adjustment": 1.02}'::jsonb,
    'Milwaukee Bucks @ Boston Celtics', 'NBA', now() + interval '6 hours'
),
-- Pro Pick 4 (Football - BTTS)
(
    'fix_epl_mci_liv', 'football', 'soccer_epl', 'btts', NULL, NULL, 'Yes', 0.5,
    'SportyBet', 1.75, -133, 0.5714, 1.493, 0.6700,
    1.00, 0.50, 17.25, 89.5, 2.00, 'pro', 'pending',
    '{"home_scoring_prob": 0.84, "away_scoring_prob": 0.79, "h2h_btts_rate_l5": 0.80}'::jsonb,
    'Manchester City vs Liverpool', 'Premier League', now() + interval '24 hours'
);

-- 4. Populate Curated Parlay ("PointBlank / The Daily Slip")
INSERT INTO public.curated_parlays (
    title, slate_date, legs, total_sportsbook_odds, total_fair_odds, model_win_probability,
    combined_ev_percentage, correlation_score, recommended_units, tier, status, summary_analysis
) VALUES (
    'PointBlank: Global Cross-League Slate',
    CURRENT_DATE,
    '[
        {
            "fixture": "Guangdong vs Liaoning (CBA)",
            "prop": "Tremont Waters Over 8.5 Assists",
            "odds": 2.10,
            "bookmaker": "1xBet",
            "ev": "+23.9%"
        },
        {
            "fixture": "Arsenal vs Chelsea (EPL)",
            "prop": "Over 2.5 Total Goals",
            "odds": 1.91,
            "bookmaker": "Bet365",
            "ev": "+16.5%"
        },
        {
            "fixture": "Lakers vs Warriors (NBA)",
            "prop": "Stephen Curry Over 26.5 Points",
            "odds": 1.95,
            "bookmaker": "DraftKings",
            "ev": "+13.1%"
        }
    ]'::jsonb,
    7.82, -- 2.10 * 1.91 * 1.95
    4.86,
    0.214,
    38.4,
    1.18, -- 18% positive correlation boost
    0.50,
    'pro',
    'pending',
    'Staggered global slate: Morning CBA transition tempo flows into high-xG London derby, concluding with late-night West Coast pace battle. High expected value across all three independent legs.'
);

-- 5. Populate EdgeRadar Line Movements
INSERT INTO public.line_movements (
    fixture_id, market_key, selection, opening_odds, current_odds, opening_line, current_line,
    steam_direction, sharp_book, divergent_book, divergence_percentage, alert_type, match_title, sport
) VALUES (
    'fix_nba_lal_gsw', 'spreads', 'Golden State Warriors', 1.95, 1.80, -2.5, -4.0,
    'shortening', 'Pinnacle', 'SportyBet', 8.33, 'steam_move', 'Golden State Warriors @ Los Angeles Lakers', 'basketball'
),
(
    'fix_epl_ars_che', 'totals', 'Over 2.5 Goals', 2.05, 1.88, 2.5, 2.5,
    'shortening', 'Pinnacle', 'Bet365', 9.04, 'reverse_line_movement', 'Arsenal vs Chelsea', 'football'
);
