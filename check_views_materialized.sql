-- ============================================
-- CHECK FOR VIEWS AND MATERIALIZED VIEWS
-- ============================================
-- This checks if there are views that might be affecting isEnabled
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check all views
SELECT 
  'VIEW' AS type,
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%businesses%'
ORDER BY table_name;

-- 2. Check all materialized views
SELECT 
  'MATERIALIZED_VIEW' AS type,
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition ILIKE '%businesses%'
ORDER BY matviewname;

-- 3. Check if businesses table is actually a view
SELECT 
  'TABLE_TYPE' AS type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'businesses';

-- 4. Try to update directly and see what happens
SELECT 
  'BEFORE_DIRECT_UPDATE' AS phase,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Update directly
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Check immediately after
SELECT 
  'AFTER_DIRECT_UPDATE' AS phase,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Wait 2 seconds
SELECT pg_sleep(2);

-- Check again
SELECT 
  'AFTER_WAIT_2_SEC' AS phase,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

