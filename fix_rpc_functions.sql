-- ============================================
-- FIX: Improve RPC functions to ensure updates persist
-- ============================================
-- These functions now verify that updates actually took effect
-- and raise an exception if they didn't

-- 1. Fix update_business_is_enabled
DROP FUNCTION IF EXISTS update_business_is_enabled(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION update_business_is_enabled(
  p_business_id TEXT,
  p_is_enabled BOOLEAN
)
RETURNS TABLE (
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
BEGIN
  -- Update directly - use explicit boolean value
  UPDATE public.businesses
  SET "isEnabled" = p_is_enabled
  WHERE "businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch the updated values into variables
  SELECT 
    b."businessId",
    b.name,
    b."isEnabled"
  INTO 
    v_business_id,
    v_name,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- Verify the value was actually updated
  IF v_is_enabled IS DISTINCT FROM p_is_enabled THEN
    RAISE EXCEPTION 'Update failed: expected isEnabled=%, but got %', p_is_enabled, v_is_enabled;
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_business_id,
    v_name,
    v_is_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- 2. Fix update_business_subscription
DROP FUNCTION IF EXISTS update_business_subscription(TEXT, JSONB);

CREATE OR REPLACE FUNCTION update_business_subscription(
  p_business_id TEXT,
  p_subscription JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN,
  subscription JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subscription JSONB;
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
  v_subscription JSONB;
BEGIN
  -- If status is 'active' and nextBillingDate is in the past, remove it
  -- This prevents auto-expire from immediately changing it back to 'expired'
  updated_subscription := p_subscription;
  IF updated_subscription->>'status' = 'active' AND updated_subscription->>'nextBillingDate' IS NOT NULL THEN
    -- Check if nextBillingDate is in the past
    IF (updated_subscription->>'nextBillingDate')::timestamp < NOW() THEN
      -- Remove nextBillingDate to prevent auto-expire
      updated_subscription := updated_subscription - 'nextBillingDate';
    END IF;
  END IF;
  
  -- Always remove nextBillingDate if status is 'active' to prevent auto-expire issues
  IF updated_subscription->>'status' = 'active' THEN
    updated_subscription := updated_subscription - 'nextBillingDate';
  END IF;
  
  -- Update the subscription directly
  UPDATE public.businesses
  SET subscription = updated_subscription
  WHERE "businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch the updated values into variables
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."isEnabled",
    b.subscription
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- Verify the subscription was actually updated
  IF v_subscription->>'status' IS DISTINCT FROM updated_subscription->>'status' THEN
    RAISE EXCEPTION 'Update failed: expected status=%, but got %', 
      updated_subscription->>'status', 
      v_subscription->>'status';
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription;
END;
$$;

GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO authenticated;

