-- EdgePoint+ RevenueCat Webhook Processor
-- Migration: 20260905_03_revenuecat_webhook.sql
-- Description: Function to ingest RevenueCat webhook events and update user subscription status.

CREATE OR REPLACE FUNCTION public.process_revenuecat_event(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_type TEXT;
    app_user_id TEXT;
    user_uuid UUID;
    expiration_at_ms BIGINT;
    expiration_timestamptz TIMESTAMPTZ;
    entitlement_ids TEXT[];
    has_pro_entitlement BOOLEAN := false;
    new_status TEXT := 'free';
    new_tier TEXT := 'free';
BEGIN
    -- Extract event details from RevenueCat payload
    event_type := payload->'event'->>'type';
    app_user_id := payload->'event'->>'app_user_id';
    
    -- Check if app_user_id is a valid UUID matching an auth.users id
    BEGIN
        user_uuid := app_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid UUID app_user_id: ' || COALESCE(app_user_id, 'null'));
    END;

    -- Extract expiration timestamp (RevenueCat sends ms since epoch)
    expiration_at_ms := (payload->'event'->>'expiration_at_ms')::BIGINT;
    IF expiration_at_ms IS NOT NULL THEN
        expiration_timestamptz := to_timestamp(expiration_at_ms / 1000.0);
    END IF;

    -- Determine status based on event type
    CASE event_type
        WHEN 'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION' THEN
            new_status := 'active';
            new_tier := 'edgepoint_pro';
        WHEN 'CANCELLATION' THEN
            -- Cancelled auto-renew, but user still has access until expiration_timestamptz
            IF expiration_timestamptz IS NOT NULL AND expiration_timestamptz > now() THEN
                new_status := 'active';
                new_tier := 'edgepoint_pro';
            ELSE
                new_status := 'canceled';
                new_tier := 'free';
            END IF;
        WHEN 'EXPIRATION' THEN
            new_status := 'free';
            new_tier := 'free';
        WHEN 'BILLING_ISSUE' THEN
            -- Payment failed, but RevenueCat grants a grace period until expiration_timestamptz;
            -- keep Pro access during the grace period, same as CANCELLATION above.
            new_status := 'past_due';
            IF expiration_timestamptz IS NOT NULL AND expiration_timestamptz > now() THEN
                new_tier := 'edgepoint_pro';
            ELSE
                new_tier := 'free';
            END IF;
        ELSE
            new_status := 'free';
    END CASE;

    -- Update user profile in Supabase
    UPDATE public.profiles
    SET 
        subscription_status = new_status,
        subscription_tier = new_tier,
        subscription_period_end = expiration_timestamptz,
        revenuecat_app_user_id = app_user_id,
        updated_at = now()
    WHERE id = user_uuid;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found for ID: ' || user_uuid::TEXT);
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'user_id', user_uuid, 
        'event', event_type, 
        'status', new_status, 
        'tier', new_tier
    );
END;
$$;
