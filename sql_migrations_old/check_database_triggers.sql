-- ============================================
-- Check for triggers that might be reverting subscription updates
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check for ALL triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2. Check for functions that might be called by triggers
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%subscription%'
  OR p.proname LIKE '%business%';

-- 3. Check current subscription value directly
SELECT 
  "businessId",
  name,
  subscription,
  subscription->>'status' as "status",
  subscription->>'planType' as "planType"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Try direct update and see if it persists
BEGIN;
UPDATE businesses 
SET subscription = '{"status": "active", "planType": "menu_only"}'::jsonb
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, subscription;

-- Check immediately after update (in same transaction)
SELECT 
  "businessId",
  name,
  subscription->>'status' as "status",
  subscription->>'planType' as "planType"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- COMMIT; -- Uncomment to commit, or ROLLBACK; to rollback

-- 5. Check if there's a default value on subscription column
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'subscription';

