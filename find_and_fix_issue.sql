-- ============================================
-- FIND AND FIX THE ISSUE - Complete diagnostic
-- ============================================

-- 1. Check ALL triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses';

-- 2. Check ALL functions that might affect businesses
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%businesses%'
ORDER BY routine_name;

-- 3. Check ALL constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass;

-- 4. Check current value
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5. Try to update and see what happens
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled", subscription->>'status' AS subscription_status;

-- 6. Check again immediately
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. DISABLE ALL TRIGGERS (if any exist)
-- DO NOT RUN THIS YET - just check first
-- ALTER TABLE businesses DISABLE TRIGGER ALL;

