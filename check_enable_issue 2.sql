-- ============================================
-- CHECK WHY ENABLE IS NOT WORKING
-- ============================================
-- This script checks for triggers or other issues when enabling a business

-- 1. Check current value
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  "createdAt"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Check for triggers that might fire on UPDATE
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

-- 3. Check for any functions that might be called by triggers
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
    OR routine_definition ILIKE '%businesses%'
  )
ORDER BY routine_name;

-- 4. Try to enable directly
UPDATE businesses
SET "isEnabled" = true
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5. Check if update persisted immediately
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Wait and check again
SELECT pg_sleep(1);

SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Test the RPC function directly
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', true);

-- 8. Check again after RPC
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


