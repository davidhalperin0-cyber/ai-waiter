-- ============================================
-- FIND CODE THAT AUTO-UPDATES isEnabled
-- ============================================
-- This script finds any database logic that automatically sets isEnabled = true

-- 1. Check ALL functions that might set isEnabled
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
  )
ORDER BY routine_name;

-- 2. Check for any triggers that might set isEnabled
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND action_statement ILIKE '%isEnabled%'
ORDER BY trigger_name;

-- 3. Check for any rules that might set isEnabled
SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules
WHERE tablename = 'businesses'
  AND definition ILIKE '%isEnabled%';

-- 4. Check if update_business_subscription sets isEnabled
-- Look at the function definition
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_business_subscription';

-- 5. Test: Update subscription and see if isEnabled changes
-- First, set isEnabled to false
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Check current state
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Update subscription to active (via RPC)
SELECT * FROM update_business_subscription(
  'b72bca1a-7fd3-470d-998e-971785f30ab4',
  '{"status": "active", "planType": "menu_only"}'::jsonb
);

-- Check if isEnabled changed
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Test: Update subscription via standard update
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Update subscription via standard update
UPDATE businesses
SET subscription = '{"status": "active", "planType": "menu_only"}'::jsonb
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Check if isEnabled changed
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


