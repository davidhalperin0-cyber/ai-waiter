-- ============================================
-- CREATE RPC FUNCTION TO GET BUSINESS DATA
-- ============================================
-- This RPC function gets business data directly
-- to avoid connection pooling / stale read issues
-- Run this in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION get_business_is_enabled(
  p_business_id TEXT
)
RETURNS TABLE (
  "businessId" TEXT,
  "isEnabled" BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id TEXT;
  v_is_enabled BOOLEAN;
BEGIN
  -- Force a commit point to ensure we see the latest data
  -- This helps avoid stale reads from connection pooling
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_read'));
  
  -- Small delay to ensure we're reading from committed data
  PERFORM pg_sleep(0.05);
  
  -- Fetch the current value directly with FOR UPDATE to lock the row
  -- This ensures we get the most up-to-date value
  SELECT 
    b."businessId",
    b."isEnabled"
  INTO 
    v_business_id,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE SKIP LOCKED;
  
  -- If not found, return null
  IF v_business_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_business_id,
    v_is_enabled;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_is_enabled(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_business_is_enabled(TEXT) TO authenticated;

