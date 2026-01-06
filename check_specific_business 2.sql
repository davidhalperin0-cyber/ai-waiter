-- ============================================
-- Check specific business for triggers/constraints
-- ============================================

-- 1. Check the business data
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Check if there are any triggers that fire on UPDATE
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND event_manipulation = 'UPDATE'
ORDER BY trigger_name;

-- 3. Check for any constraints
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
ORDER BY conname;

-- 4. Try to manually update and see what happens
-- (This will help us see if there's a trigger)
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled";

-- 5. Check the value again
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


