-- ============================================
-- CLEAN AND RECREATE ALL BUSINESS FUNCTIONS
-- ============================================
-- This script removes ALL existing functions related to businesses
-- Then recreates them from COMPLETE_DATABASE_SCHEMA.sql
-- Run this in Supabase SQL Editor BEFORE running COMPLETE_DATABASE_SCHEMA.sql
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING BUSINESS-RELATED FUNCTIONS
-- ============================================

-- Drop update_business_is_enabled
DROP FUNCTION IF EXISTS update_business_is_enabled(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS update_business_is_enabled(text, boolean);
DROP FUNCTION IF EXISTS update_business_is_enabled(varchar, boolean);

-- Drop update_business_subscription
DROP FUNCTION IF EXISTS update_business_subscription(TEXT, JSONB);
DROP FUNCTION IF EXISTS update_business_subscription(text, jsonb);
DROP FUNCTION IF EXISTS update_business_subscription(varchar, jsonb);

-- Drop exec_sql (if exists - this is dangerous and shouldn't be used)
DROP FUNCTION IF EXISTS exec_sql(TEXT, JSONB);
DROP FUNCTION IF EXISTS exec_sql(text, jsonb);

-- Drop any other functions that might update businesses
-- Check for any functions that contain 'business' or 'isEnabled' in their definition
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT 
      routine_schema,
      routine_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM information_schema.routines
    JOIN pg_proc p ON p.proname = routine_name
    WHERE routine_schema = 'public'
      AND (
        routine_definition ILIKE '%businesses%'
        OR routine_definition ILIKE '%isEnabled%'
        OR routine_definition ILIKE '%is_enabled%'
      )
      AND routine_name NOT LIKE 'pg_%'
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
        r.routine_schema, 
        r.routine_name, 
        r.args);
      RAISE NOTICE 'Dropped function: %.%(%)', r.routine_schema, r.routine_name, r.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop function %.%(%): %', r.routine_schema, r.routine_name, r.args, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- 2. VERIFY ALL FUNCTIONS ARE REMOVED
-- ============================================
SELECT 
  'REMAINING FUNCTIONS' AS status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%businesses%'
    OR routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
  )
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- ============================================
-- 3. NEXT STEPS
-- ============================================
-- After running this script:
-- 1. Run COMPLETE_DATABASE_SCHEMA.sql (it will recreate the functions)
-- 2. Or manually run the function definitions from COMPLETE_DATABASE_SCHEMA.sql
-- ============================================

