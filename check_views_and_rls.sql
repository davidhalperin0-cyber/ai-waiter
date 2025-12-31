-- ============================================
-- CHECK VIEWS, MATERIALIZED VIEWS, AND RLS POLICIES
-- ============================================
-- This script checks for views, materialized views, and RLS policies that might affect isEnabled

-- 1. Check for views that might affect businesses table
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%businesses%'
ORDER BY table_name;

-- 2. Check for materialized views
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition ILIKE '%businesses%';

-- 3. Check for RLS policies on businesses table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;

-- 4. Check if RLS is enabled on businesses table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'businesses';

-- 5. Check current value
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Test update directly
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Check immediately
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Wait 2 seconds
SELECT pg_sleep(2);

-- 9. Check again
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

