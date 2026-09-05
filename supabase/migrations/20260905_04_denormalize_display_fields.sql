-- EdgePoint+ Mobile Display Field Denormalization
-- Migration: 20260905_04_denormalize_display_fields.sql
-- Description: The mobile client renders one flat row per card (match title, league
-- display name, kickoff time) without joining against fixtures/sports_leagues per
-- screen. Add those fields directly to model_predictions and line_movements.

ALTER TABLE public.model_predictions
    ADD COLUMN IF NOT EXISTS match_title TEXT,
    ADD COLUMN IF NOT EXISTS league_name TEXT,
    ADD COLUMN IF NOT EXISTS commence_time TIMESTAMPTZ;

ALTER TABLE public.line_movements
    ADD COLUMN IF NOT EXISTS match_title TEXT,
    ADD COLUMN IF NOT EXISTS sport TEXT CHECK (sport IN ('basketball', 'football'));

-- Backfill any existing rows from their parent fixture/league before enforcing NOT NULL
UPDATE public.model_predictions p
SET match_title = COALESCE(p.match_title, f.home_team || ' vs ' || f.away_team),
    commence_time = COALESCE(p.commence_time, f.commence_time),
    league_name = COALESCE(p.league_name, l.name)
FROM public.fixtures f
LEFT JOIN public.sports_leagues l ON l.id = p.league_id
WHERE p.fixture_id = f.id;

UPDATE public.line_movements lm
SET match_title = COALESCE(lm.match_title, f.home_team || ' vs ' || f.away_team),
    sport = COALESCE(lm.sport, f.sport)
FROM public.fixtures f
WHERE lm.fixture_id = f.id;

ALTER TABLE public.model_predictions
    ALTER COLUMN match_title SET NOT NULL,
    ALTER COLUMN commence_time SET NOT NULL;

ALTER TABLE public.line_movements
    ALTER COLUMN match_title SET NOT NULL,
    ALTER COLUMN sport SET NOT NULL;
