-- ============================================
-- Create RPC function to update business subscription
-- This bypasses any RLS or trigger issues
-- Run this in Supabase SQL Editor
-- ============================================

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
AS $$
DECLARE
  updated_subscription JSONB;
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
  
  UPDATE businesses
  SET subscription = updated_subscription
  WHERE businesses."businessId" = p_business_id;
  
  RETURN QUERY
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."isEnabled",
    b.subscription
  FROM businesses b
  WHERE b."businessId" = p_business_id;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO service_role;

-- Test the function
-- SELECT * FROM update_business_subscription('b72bca1a-7fd3-470d-998e-971785f30ab4', '{"status": "active", "planType": "menu_only"}'::jsonb);

