-- ============================================
-- FIX RPC FUNCTION AMBIGUITY ERROR
-- ============================================
-- This fixes the "column reference is ambiguous" error
-- Run this in Supabase SQL Editor

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
  -- Update directly - use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled
  WHERE b."businessId" = p_business_id;
  
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- Test the function
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', false);

