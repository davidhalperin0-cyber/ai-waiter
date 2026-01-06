-- ============================================
-- TEST isEnabled PERSISTENCE
-- ============================================
-- This script tests if isEnabled persists correctly

-- 1. Check current value
SELECT 
  "businessId",
  name,
  "isEnabled",
  "createdAt"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Test RPC function directly
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', false);

-- 3. Check immediately after RPC
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 1 second
SELECT pg_sleep(1);

-- 5. Check again
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Wait 2 more seconds
SELECT pg_sleep(2);

-- 7. Check again
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Check for any triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses';

-- 9. Check for any functions that might be called
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%isEnabled%'
ORDER BY routine_name;


