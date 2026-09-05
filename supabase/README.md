# EdgePoint+ Database (Supabase PostgreSQL)

This directory contains the database schema, security policies, and seed data for the EdgePoint+ sports betting analytics and +EV prediction platform.

## Architecture & Schema Overview

1. **`public.profiles`**: Extends Supabase `auth.users`. Tracks subscription status (`free`, `active`, `trialing`, `past_due`, `canceled`) and tier (`free`, `edgepoint_pro`). Synchronized automatically with RevenueCat via webhook.
2. **`public.sports_leagues`**: Supported basketball leagues (`NBA`, `EuroLeague`, `CBA`, `PBA`, `NBL`) and football leagues (`EPL`, `UCL`, `La Liga`, etc.).
3. **`public.fixtures`**: Match slates with commence times, venues, and status.
4. **`public.odds_snapshots`**: Captured odds from sportsbooks (Pinnacle, Bet365, DraftKings, SportyBet, 1xBet).
5. **`public.model_predictions`**: Quantitative engine output:
   - `edge_score` (0–100 composite rating)
   - `edge_delta` ($\text{Projected} - \text{Line}$)
   - `ev_percentage` ($(\text{Model Prob} \times \text{Sportsbook Odds} - 1) \times 100$)
   - `fair_odds` (vig-stripped fair line)
   - `tier` (`free` vs `pro`)
6. **`public.curated_parlays`**: PointBlank "The Daily Slip" multi-leg correlated slips.
7. **`public.line_movements`**: EdgeRadar tracking sharp line steam, reverse line moves (RLM), and off-market lines.
8. **`public.user_saved_slips`**: User's personal bet slips and bankroll tracking.

---

## Deployment Instructions

### Method 1: Supabase Web Dashboard (Recommended for quick start)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Open the **SQL Editor** from the left navigation.
3. Execute the SQL files in numerical order:
   - Run `migrations/20260905_01_init_schema.sql`
   - Run `migrations/20260905_02_rls_policies.sql`
   - Run `migrations/20260905_03_revenuecat_webhook.sql`
   - Run `migrations/20260905_04_denormalize_display_fields.sql`
   - (Optional) Run `seed_mock_data.sql` to populate sample live picks for testing.

### Method 2: Supabase CLI
```bash
supabase db push
# or link and push
supabase link --project-ref your-project-id
supabase db reset
```

---

## RevenueCat Webhook Integration
To link RevenueCat purchases directly into Supabase:
1. In the RevenueCat Dashboard, go to **Integrations** -> **Webhooks**.
2. Add a new webhook targeting your Supabase Edge Function or database endpoint (e.g. `https://<your-project-ref>.supabase.co/rest/v1/rpc/process_revenuecat_event`).
3. Whenever a purchase or renewal fires, `process_revenuecat_event` automatically sets `subscription_status = 'active'` and `subscription_tier = 'edgepoint_pro'` for that user UUID!
