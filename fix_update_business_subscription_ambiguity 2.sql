-- ============================================
-- FIX update_business_subscription AMBIGUITY ERROR
-- ============================================
-- This fixes the "column reference is ambiguous" error
-- Run this in Supabase SQL Editor

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
  
  -- Update the subscription directly - use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET subscription = updated_subscription
  WHERE b."businessId" = p_business_id;
  
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO authenticated;

-- Test the function
SELECT * FROM update_business_subscription(
  'b72bca1a-7fd3-470d-998e-971785f30ab4',
  '{"status": "active", "planType": "menu_only"}'::jsonb
);


