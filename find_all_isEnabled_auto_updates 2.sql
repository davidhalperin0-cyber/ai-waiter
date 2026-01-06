-- ============================================
-- FIND ALL LOGIC THAT AUTO-UPDATES isEnabled
-- ============================================
-- This script finds EVERYTHING that might automatically update isEnabled
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CHECK ALL TRIGGERS ON businesses TABLE
-- ============================================
SELECT 
  'TRIGGER' AS source_type,
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
  'FUNCTION' AS source_type,
  routine_name AS name,
  routine_type AS type,
  routine_definition AS definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
    OR routine_definition ILIKE '%businesses%'
  )
ORDER BY routine_name;

-- ============================================
-- 3. CHECK ALL RULES ON businesses TABLE
-- ============================================
SELECT 
  'RULE' AS source_type,
  rulename AS name,
  definition AS definition
FROM pg_rules
WHERE tablename = 'businesses'
ORDER BY rulename;

-- ============================================
-- 4. CHECK ALL CONSTRAINTS THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'CONSTRAINT' AS source_type,
  conname AS name,
  contype AS type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
  AND (
    pg_get_constraintdef(oid) ILIKE '%isEnabled%'
    OR pg_get_constraintdef(oid) ILIKE '%subscription%'
  )
ORDER BY conname;

-- ============================================
-- 5. CHECK FOR VIEWS THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'VIEW' AS source_type,
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
  'MATERIALIZED_VIEW' AS source_type,
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
  'RLS_POLICY' AS source_type,
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
-- 8. CHECK FOR DEFAULT VALUES THAT MIGHT AFFECT isEnabled
-- ============================================
SELECT 
  'DEFAULT' AS source_type,
  column_name AS name,
  column_default AS definition,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- ============================================
-- 9. TEST: Update subscription and check if isEnabled changes
-- ============================================
-- First, set isEnabled to false
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Check current state
SELECT 
  'BEFORE_UPDATE' AS test_phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Update subscription to active via RPC
SELECT * FROM update_business_subscription(
  'b72bca1a-7fd3-470d-998e-971785f30ab4',
  '{"status": "active", "planType": "menu_only"}'::jsonb
);

-- Check if isEnabled changed AFTER subscription update
SELECT 
  'AFTER_SUBSCRIPTION_UPDATE' AS test_phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- ============================================
-- 10. DISABLE ALL TRIGGERS (if found)
-- ============================================
-- Uncomment this section if triggers are found
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'businesses'
  LOOP
    EXECUTE format('ALTER TABLE businesses DISABLE TRIGGER %I', r.trigger_name);
    RAISE NOTICE 'Disabled trigger: %', r.trigger_name;
  END LOOP;
END $$;
*/


