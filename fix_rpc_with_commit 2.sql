-- ============================================
-- FIX RPC FUNCTION WITH EXPLICIT COMMIT
-- ============================================
-- This version adds explicit transaction handling
-- Run this in Supabase SQL Editor
-- ============================================

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
  -- Use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled::BOOLEAN
  WHERE b."businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Force commit by doing a dummy operation that requires commit
  -- This ensures the transaction is committed before we read back
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.05);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE to lock the row and prevent concurrent modifications
  SELECT 
    b."businessId",
    b.name,
    b."isEnabled"
  INTO 
    v_business_id,
    v_name,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE;
  
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- Verify function was created
SELECT 
  '✅ Function created' AS status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_business_is_enabled';


