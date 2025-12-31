-- ============================================
-- CHECK IF SOMETHING CHANGES isEnabled BACK
-- ============================================
-- This script checks if something automatically changes isEnabled back to true
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check current value
SELECT 
  '1_CURRENT_VALUE' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Set to false via RPC
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  false::BOOLEAN
);

-- 3. Check immediately after RPC (same transaction)
SELECT 
  '2_AFTER_RPC' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 1 second
SELECT pg_sleep(1);

-- 5. Check after wait
SELECT 
  '3_AFTER_1_SEC' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Wait 2 more seconds
SELECT pg_sleep(2);

-- 7. Check again
SELECT 
  '4_AFTER_3_SEC_TOTAL' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Check if there are any active triggers or functions that might change isEnabled
SELECT 
  '5_CHECK_TRIGGERS' AS step,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND action_statement LIKE '%isEnabled%';

-- 9. Check if there are any functions that update businesses.isEnabled
SELECT 
  '6_CHECK_FUNCTIONS' AS step,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%isEnabled%'
  AND routine_name != 'update_business_is_enabled'
  AND routine_name != 'get_business_is_enabled';

