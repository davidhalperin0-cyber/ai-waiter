-- ============================================
-- CHECK FOR TRIGGERS AND FUNCTIONS THAT MIGHT CHANGE isEnabled
-- ============================================
-- Run this in Supabase SQL Editor to find what's changing isEnabled back
-- ============================================

-- ============================================
-- 1. CHECK ALL TRIGGERS ON businesses TABLE
-- ============================================
SELECT 
  'TRIGGER' AS type,
  trigger_name AS name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement AS definition
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- ============================================
-- 2. CHECK ALL FUNCTIONS THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'FUNCTION' AS type,
  routine_name AS name,
  routine_type AS function_type,
  routine_definition AS definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
    OR routine_definition ILIKE '%businesses%'
  )
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- ============================================
-- 3. CHECK FOR RULES ON businesses TABLE
-- ============================================
SELECT 
  'RULE' AS type,
  rulename AS name,
  definition AS definition
FROM pg_rules
WHERE tablename = 'businesses'
ORDER BY rulename;

-- ============================================
-- 4. CHECK FOR CONSTRAINTS THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'CONSTRAINT' AS type,
  conname AS name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
  AND (
    pg_get_constraintdef(oid) ILIKE '%isEnabled%'
    OR pg_get_constraintdef(oid) ILIKE '%is_enabled%'
    OR pg_get_constraintdef(oid) ILIKE '%subscription%'
  )
ORDER BY conname;

-- ============================================
-- 5. CHECK FOR VIEWS THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'VIEW' AS type,
  table_name AS name,
  view_definition AS definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%businesses%'
  AND view_definition ILIKE '%isEnabled%'
ORDER BY table_name;

-- ============================================
-- 6. CHECK FOR MATERIALIZED VIEWS
-- ============================================
SELECT 
  'MATERIALIZED_VIEW' AS type,
  matviewname AS name,
  definition AS definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition ILIKE '%businesses%'
  AND definition ILIKE '%isEnabled%'
ORDER BY matviewname;

-- ============================================
-- 7. CHECK FOR RLS POLICIES THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'RLS_POLICY' AS type,
  policyname AS name,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'businesses'
  AND (
    qual ILIKE '%isEnabled%'
    OR with_check ILIKE '%isEnabled%'
  )
ORDER BY policyname;

-- ============================================
-- 8. CHECK DEFAULT VALUE ON isEnabled COLUMN
-- ============================================
SELECT 
  'COLUMN_DEFAULT' AS type,
  column_name AS name,
  column_default AS default_value,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- ============================================
-- 9. TEST: Try to update isEnabled and see what happens
-- ============================================
-- First, check current value
SELECT 
  'BEFORE_UPDATE' AS test_phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Try to update via RPC
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4',
  true
);

-- Wait a moment
SELECT pg_sleep(1);

-- Check again immediately after
SELECT 
  'AFTER_RPC_UPDATE' AS test_phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- ============================================
-- 10. CHECK FOR ANY EXTENSIONS THAT MIGHT AFFECT THIS
-- ============================================
SELECT 
  'EXTENSION' AS type,
  extname AS name,
  extversion AS version
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_trgm', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

