-- ============================================
-- COMPLETE FIX FOR RPC FUNCTION
-- ============================================
-- This script completely fixes the RPC function to prevent isEnabled from changing back

-- 1. Drop and recreate the function with better logic
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
  update_count INTEGER;
BEGIN
  -- Update directly with explicit boolean - use table alias
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled::BOOLEAN
  WHERE b."businessId" = p_business_id;
  
  -- Get the number of rows updated
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Verify the update actually happened
  IF update_count = 0 THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Wait a tiny bit to ensure transaction is committed
  PERFORM pg_sleep(0.1);
  
  -- Fetch the updated values into variables - use FOR UPDATE to lock the row
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
  
  -- Verify the value was actually updated - use explicit comparison
  IF (v_is_enabled IS TRUE AND p_is_enabled IS FALSE) OR 
     (v_is_enabled IS FALSE AND p_is_enabled IS TRUE) THEN
    -- Try one more time with explicit cast
    UPDATE public.businesses b
    SET "isEnabled" = p_is_enabled::BOOLEAN
    WHERE b."businessId" = p_business_id;
    
    -- Fetch again
    SELECT b."isEnabled"
    INTO v_is_enabled
    FROM public.businesses b
    WHERE b."businessId" = p_business_id;
    
    -- If still doesn't match, raise exception
    IF (v_is_enabled IS TRUE AND p_is_enabled IS FALSE) OR 
       (v_is_enabled IS FALSE AND p_is_enabled IS TRUE) THEN
      RAISE EXCEPTION 'Update failed: expected isEnabled=%, but got %', p_is_enabled, v_is_enabled;
    END IF;
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

-- Test the function
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', false);

-- Check if it persisted
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


