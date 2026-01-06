-- ============================================
-- Comprehensive check for all triggers and functions
-- ============================================

-- 1. Check ALL triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation,
  action_condition
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2. Check ALL functions that might affect businesses table
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%businesses%'
    OR routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%subscription%'
  )
ORDER BY routine_name;

-- 3. Check for any views that might have triggers
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%businesses%';

-- 4. Check for any materialized views
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition ILIKE '%businesses%';

-- 5. Check the specific business that's having issues
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  "subscriptionlocked",
  "createdAt"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Check if there's a rule that might be affecting updates
SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules
WHERE tablename = 'businesses';


