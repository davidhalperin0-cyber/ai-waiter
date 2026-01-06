-- ============================================
-- Check for constraints that might affect isEnabled
-- ============================================

-- 1. Check ALL constraints on businesses table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
ORDER BY conname;

-- 2. Check if there's a CHECK constraint that sets isEnabled based on subscription
SELECT 
  conname,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
  AND contype = 'c'
  AND (
    pg_get_constraintdef(oid) ILIKE '%isEnabled%'
    OR pg_get_constraintdef(oid) ILIKE '%subscription%'
  );

-- 3. Check the actual value in the database RIGHT NOW
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Try to manually update and see what happens
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled", subscription->>'status' AS subscription_status;

-- 5. Check again immediately after
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


