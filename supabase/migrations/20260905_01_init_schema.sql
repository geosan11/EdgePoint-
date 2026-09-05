-- EdgePoint+ Database Schema
-- Migration: 20260905_01_init_schema.sql
-- Description: Core tables for users, fixtures, odds, mathematical predictions, parlays, and line movements.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles & Subscriptions
-- Directly linked to Supabase Auth (auth.users) and managed via RevenueCat webhooks
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'edgepoint_pro')),
    subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'trialing', 'past_due', 'canceled')),
    subscription_period_end TIMESTAMPTZ,
    revenuecat_app_user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by status and auth id
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_status, subscription_tier);

-- 3. Sports & Leagues
CREATE TABLE IF NOT EXISTS public.sports_leagues (
    id TEXT PRIMARY KEY, -- e.g. 'basketball_nba', 'soccer_epl'
    name TEXT NOT NULL,  -- e.g. 'NBA', 'Premier League'
    sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football')),
    region TEXT NOT NULL, -- 'North America', 'Europe', 'Asia', 'Oceania', etc.
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Fixtures / Match Slates
CREATE TABLE IF NOT EXISTS public.fixtures (
    id TEXT PRIMARY KEY, -- Unique provider ID or generated hash
    sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football')),
    league_id TEXT REFERENCES public.sports_leagues(id) ON DELETE CASCADE,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    commence_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'canceled')),
    home_score INTEGER,
    away_score INTEGER,
    venue TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fixtures_commence ON public.fixtures(commence_time);
CREATE INDEX IF NOT EXISTS idx_fixtures_league ON public.fixtures(league_id);

-- 5. Bookmaker Odds Snapshots
CREATE TABLE IF NOT EXISTS public.odds_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL, -- e.g. 'pinnacle', 'draftkings', 'bet365', 'sportybet'
    market_key TEXT NOT NULL, -- e.g. 'h2h', 'spreads', 'totals', 'player_points', 'player_assists'
    outcomes JSONB NOT NULL, -- [{ name, price, point }]
    captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_odds_fixture_captured ON public.odds_snapshots(fixture_id, captured_at DESC);

-- 6. Model Predictions (+EV Edge Picks)
-- Stores the quantitative algorithm output for both Basketball props and Football markets
CREATE TABLE IF NOT EXISTS public.model_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
    sport TEXT NOT NULL CHECK (sport IN ('basketball', 'football')),
    league_id TEXT REFERENCES public.sports_leagues(id) ON DELETE CASCADE,
    market_type TEXT NOT NULL, -- 'player_points', 'player_rebounds', 'player_assists', 'pra_combo', 'match_total', 'spread', 'btts'
    player_name TEXT, -- Null for game-level markets
    team_name TEXT,
    selection TEXT NOT NULL, -- 'Over', 'Under', 'Home', 'Away', 'Yes', 'No'
    line NUMERIC(6, 2), -- e.g. 24.5 points, 2.5 goals, -4.5 spread
    best_bookmaker TEXT NOT NULL,
    sportsbook_odds NUMERIC(6, 3) NOT NULL, -- Decimal odds (e.g. 1.950)
    american_odds INTEGER, -- e.g. -105, +110
    implied_probability NUMERIC(5, 4) NOT NULL, -- 1 / odds
    fair_odds NUMERIC(6, 3) NOT NULL, -- Model devigged fair odds
    model_probability NUMERIC(5, 4) NOT NULL, -- True probability estimated by model
    model_projected_stat NUMERIC(6, 2), -- Expected stat output (e.g. 28.1 points or 1.65 xG)
    edge_delta NUMERIC(6, 2), -- model_projected_stat - line
    ev_percentage NUMERIC(6, 2) NOT NULL, -- ((model_probability * sportsbook_odds) - 1) * 100
    edge_score NUMERIC(5, 1) NOT NULL CHECK (edge_score >= 0 AND edge_score <= 100), -- 0 - 100 confidence metric
    recommended_units NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- Fractional Kelly sizing
    tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro')), -- Free tier provides teaser picks
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'void')),
    analysis_notes JSONB, -- Breakdown of rolling form (L3/L5/L10), pace factor, xG, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_predictions_tier_ev ON public.model_predictions(tier, ev_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_edge_score ON public.model_predictions(edge_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_fixture ON public.model_predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_sport ON public.model_predictions(sport);

-- 7. PointBlank: Curated Multi-Leg Parlays ("The Daily Slip")
CREATE TABLE IF NOT EXISTS public.curated_parlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'The Daily PointBlank Slip',
    slate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    legs JSONB NOT NULL, -- Array of leg objects with prediction_id, game, prop, selection, odds
    total_sportsbook_odds NUMERIC(8, 3) NOT NULL,
    total_fair_odds NUMERIC(8, 3) NOT NULL,
    model_win_probability NUMERIC(5, 4) NOT NULL,
    combined_ev_percentage NUMERIC(6, 2) NOT NULL,
    correlation_score NUMERIC(4, 2) NOT NULL, -- Positive correlation multiplier
    recommended_units NUMERIC(4, 2) NOT NULL DEFAULT 0.50,
    tier TEXT NOT NULL DEFAULT 'pro' CHECK (tier IN ('free', 'pro')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
    summary_analysis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_curated_parlays_date ON public.curated_parlays(slate_date DESC);

-- 8. EdgeRadar: Line Movement & Steam Tracker
CREATE TABLE IF NOT EXISTS public.line_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id TEXT REFERENCES public.fixtures(id) ON DELETE CASCADE,
    market_key TEXT NOT NULL,
    selection TEXT NOT NULL,
    opening_odds NUMERIC(6, 3) NOT NULL,
    current_odds NUMERIC(6, 3) NOT NULL,
    opening_line NUMERIC(6, 2),
    current_line NUMERIC(6, 2),
    steam_direction TEXT CHECK (steam_direction IN ('shortening', 'drifting', 'line_shift')),
    sharp_book TEXT NOT NULL DEFAULT 'Pinnacle',
    divergent_book TEXT NOT NULL,
    divergence_percentage NUMERIC(5, 2) NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('reverse_line_movement', 'steam_move', 'market_arbitrage', 'off_market_line')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_line_movements_created ON public.line_movements(created_at DESC);

-- 9. User Saved Slips (Betslip Tracker)
CREATE TABLE IF NOT EXISTS public.user_saved_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    legs JSONB NOT NULL,
    total_odds NUMERIC(8, 3) NOT NULL,
    stake_units NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
    potential_payout NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cashout')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_slips_user ON public.user_saved_slips(user_id);
