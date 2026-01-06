-- ============================================
-- FIX isEnabled PERSISTENCE ISSUE
-- ============================================
-- This script fixes the issue where isEnabled reverts to false
-- after being set to true via RPC function
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

-- 2. Set to true via RPC
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  true::BOOLEAN
);

-- 3. Check immediately after RPC
SELECT 
  '2_AFTER_RPC' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 5 seconds
SELECT pg_sleep(5);

-- 5. Check after wait
SELECT 
  '3_AFTER_5_SEC' AS step,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Check if there are any triggers that might change isEnabled
SELECT 
  '4_CHECK_TRIGGERS' AS step,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND (action_statement LIKE '%isEnabled%' OR action_statement LIKE '%is_enabled%');

-- 7. Check if there are any functions that update businesses.isEnabled
SELECT 
  '5_CHECK_FUNCTIONS' AS step,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%isEnabled%' OR routine_definition LIKE '%is_enabled%')
  AND routine_name != 'update_business_is_enabled'
  AND routine_name != 'get_business_is_enabled';

-- 8. Check if there are any rules that might affect isEnabled
SELECT 
  '6_CHECK_RULES' AS step,
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules
WHERE tablename = 'businesses'
  AND (definition LIKE '%isEnabled%' OR definition LIKE '%is_enabled%');

-- 9. Check if there are any constraints that might affect isEnabled
SELECT 
  '7_CHECK_CONSTRAINTS' AS step,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'businesses'
  AND (cc.check_clause LIKE '%isEnabled%' OR cc.check_clause LIKE '%is_enabled%');

