-- ============================================
-- TEST AND FIX RPC FUNCTION
-- ============================================
-- This script:
-- 1. Checks if the function exists
-- 2. Creates it if it doesn't exist
-- 3. Tests if it works
-- ============================================

-- ============================================
-- STEP 1: CHECK IF FUNCTION EXISTS
-- ============================================
SELECT 
  'FUNCTION_CHECK' AS phase,
  routine_name,
  routine_type,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM information_schema.routines
JOIN pg_proc p ON p.proname = routine_name
WHERE routine_schema = 'public'
  AND routine_name = 'update_business_is_enabled';

-- ============================================
-- STEP 2: CREATE FUNCTION IF IT DOESN'T EXIST
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

-- ============================================
-- STEP 3: REMOVE DEFAULT FROM isEnabled (if exists)
-- ============================================
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- ============================================
-- STEP 4: TEST THE FUNCTION
-- ============================================

-- Check current value
SELECT 
  'BEFORE' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Call RPC function to set isEnabled = true
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  true::BOOLEAN
);

-- Check immediately after (within same transaction)
SELECT 
  'AFTER_RPC_SAME_TRANSACTION' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Wait 1 second
SELECT pg_sleep(1);

-- Check again after wait
SELECT 
  'AFTER_WAIT' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Try direct UPDATE (not via RPC) to see if it persists
UPDATE businesses
SET "isEnabled" = true
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Check after direct UPDATE
SELECT 
  'AFTER_DIRECT_UPDATE' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Wait again
SELECT pg_sleep(1);

-- Check one more time
SELECT 
  'AFTER_DIRECT_UPDATE_WAIT' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

