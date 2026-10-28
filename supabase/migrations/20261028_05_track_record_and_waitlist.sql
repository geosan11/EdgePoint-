-- EdgePoint+ Track Record and Waitlist Tables
-- Migration: 20261028_05_track_record_and_waitlist.sql
-- Description:
--   1. pick_record: Publicly read-only audited model history and closing line results.
--   2. waitlist: Insert-only table for anon/authenticated users joining the early access waitlist.

-- ========================================================
-- 1. PICK RECORD TABLE (Audited Model History)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.pick_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection TEXT NOT NULL,
  market TEXT NOT NULL,
  league TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_odds NUMERIC(6, 2) NOT NULL,
  closing_odds NUMERIC(6, 2),
  model_probability NUMERIC(5, 4) NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('won', 'lost', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for period queries (30d, 90d, all) and chronological sorting
CREATE INDEX IF NOT EXISTS idx_pick_record_posted_at ON public.pick_record (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pick_record_result ON public.pick_record (result);

-- Enable Row Level Security
ALTER TABLE public.pick_record ENABLE ROW LEVEL SECURITY;

-- Clients have read-only access (anon & authenticated)
CREATE POLICY "Public read access for pick_record"
ON public.pick_record
FOR SELECT
TO anon, authenticated
USING (true);

-- Service role has full write access (for automated scraper / model settlement)
CREATE POLICY "Service role manages pick_record"
ON public.pick_record
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================================
-- 2. WAITLIST TABLE (Pre-Monetization Early Access)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'paywall_modal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_unique_email ON public.waitlist (lower(email));

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Insert-only for anon and authenticated users
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Do not allow clients to read back waitlist emails (protect user privacy)
-- Only service role can read or export the waitlist
CREATE POLICY "Service role manages waitlist"
ON public.waitlist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
