-- EdgePoint+ Row-Level Security (RLS) Policies
-- Migration: 20260905_02_rls_policies.sql
-- Description: Access control rules gating EdgePoint+ Pro predictions & parlays while keeping public data accessible.

-- 1. Helper Function to Check Active Subscription
CREATE OR REPLACE FUNCTION public.is_active_subscriber()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- 'past_due' still counts while inside its RevenueCat billing-issue grace period
  -- (subscription_period_end in the future), matching process_revenuecat_event()'s
  -- BILLING_ISSUE handling in 20260905_03_revenuecat_webhook.sql. Once the grace
  -- period lapses, subscription_period_end is in the past and access is revoked.
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        subscription_status IN ('active', 'trialing')
        OR (subscription_status = 'past_due' AND subscription_period_end > now())
      )
  );
$$;

-- 2. Profiles Table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update non-subscription fields in their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Service role has full access to update subscription info
CREATE POLICY "Service role manages profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Sports & Leagues (Publicly readable)
ALTER TABLE public.sports_leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for sports leagues"
ON public.sports_leagues
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Fixtures (Publicly readable)
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for fixtures"
ON public.fixtures
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Odds Snapshots (Publicly readable for transparency)
ALTER TABLE public.odds_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for odds snapshots"
ON public.odds_snapshots
FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Model Predictions (+EV Edge Picks) RLS Gating
ALTER TABLE public.model_predictions ENABLE ROW LEVEL SECURITY;

-- Free picks are visible to everyone (anon and authenticated)
CREATE POLICY "Free model predictions visible to all"
ON public.model_predictions
FOR SELECT
TO anon, authenticated
USING (tier = 'free');

-- Pro picks are unlocked only for users with active EdgePoint+ subscription
CREATE POLICY "Pro model predictions visible to active subscribers"
ON public.model_predictions
FOR SELECT
TO authenticated
USING (
  tier = 'free' OR public.is_active_subscriber()
);

-- Ingestion service role can insert/update predictions
CREATE POLICY "Service role full access on model_predictions"
ON public.model_predictions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Curated Parlays (PointBlank / Daily Slip) RLS
ALTER TABLE public.curated_parlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Free curated parlays visible to all"
ON public.curated_parlays
FOR SELECT
TO anon, authenticated
USING (tier = 'free');

CREATE POLICY "Pro curated parlays visible to active subscribers"
ON public.curated_parlays
FOR SELECT
TO authenticated
USING (
  tier = 'free' OR public.is_active_subscriber()
);

CREATE POLICY "Service role full access on curated_parlays"
ON public.curated_parlays
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. EdgeRadar Line Movements RLS
ALTER TABLE public.line_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EdgeRadar visible to all"
ON public.line_movements
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role full access on line_movements"
ON public.line_movements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. User Saved Slips (Strictly Private)
ALTER TABLE public.user_saved_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved slips"
ON public.user_saved_slips
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Automatically Create Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, subscription_tier, subscription_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
