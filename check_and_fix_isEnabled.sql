-- ============================================
-- CHECK AND FIX isEnabled ISSUE
-- ============================================
-- This script checks for triggers, defaults, and fixes the isEnabled issue

-- 1. Check if DEFAULT still exists
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 2. Check for triggers that might affect isEnabled
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 3. Check current value for the specific business
SELECT 
  "businessId",
  name,
  "isEnabled",
  "createdAt"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. REMOVE DEFAULT if it still exists
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- 5. Try to update directly and verify
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Check if update persisted
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Wait a moment and check again (to see if something changes it back)
SELECT pg_sleep(1);

SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

