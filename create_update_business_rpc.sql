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
BEGIN
  UPDATE businesses
  SET subscription = p_subscription
  WHERE "businessId" = p_business_id;
  
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

