-- ============================================
-- TEST RPC FUNCTION DIRECTLY
-- ============================================
-- This tests if the RPC function actually updates the DB
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. First, check if the function exists
SELECT 
  'FUNCTION_CHECK' AS phase,
  routine_name,
  routine_type,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM information_schema.routines
JOIN pg_proc p ON p.proname = routine_name
WHERE routine_schema = 'public'
  AND routine_name = 'update_business_is_enabled';

-- 1. Check current value
SELECT 
  'BEFORE' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Call RPC function to set isEnabled = true (with explicit TEXT cast)
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  true::BOOLEAN
);

-- 3. Check immediately after (within same transaction)
SELECT 
  'AFTER_RPC_SAME_TRANSACTION' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 1 second (to simulate what happens in the API)
SELECT pg_sleep(1);

-- 5. Check again after wait
SELECT 
  'AFTER_WAIT' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Try direct UPDATE (not via RPC) to see if it persists
UPDATE businesses
SET "isEnabled" = true
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Check after direct UPDATE
SELECT 
  'AFTER_DIRECT_UPDATE' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Wait again
SELECT pg_sleep(1);

-- 9. Check one more time
SELECT 
  'AFTER_DIRECT_UPDATE_WAIT' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

