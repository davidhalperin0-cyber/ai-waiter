-- ============================================
-- ENSURE RPC FUNCTIONS EXIST - CRITICAL FIX
-- ============================================
-- Run this in Supabase SQL Editor to ensure RPC functions exist

-- 1. Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_business_is_enabled', 'update_business_subscription');

-- 2. Create update_business_is_enabled if it doesn't exist
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
  -- Update directly
  UPDATE public.businesses
  SET "isEnabled" = p_is_enabled
  WHERE "businessId" = p_business_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch and return
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
  
  RETURN QUERY
  SELECT 
    v_business_id,
    v_name,
    v_is_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- 3. Create update_business_subscription if it doesn't exist
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
  updated_subscription := p_subscription;
  
  -- Remove nextBillingDate if status is 'active' to prevent auto-expire
  IF updated_subscription->>'status' = 'active' THEN
    updated_subscription := updated_subscription - 'nextBillingDate';
  END IF;
  
  -- Update
  UPDATE public.businesses
  SET subscription = updated_subscription
  WHERE "businessId" = p_business_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch and return
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

-- 4. Verify functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_business_is_enabled', 'update_business_subscription');

