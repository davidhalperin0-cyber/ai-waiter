-- ============================================
-- COMPLETE FIX FOR isEnabled ISSUE
-- ============================================
-- This script:
-- 1. Removes ALL existing business-related functions
-- 2. Recreates the correct functions from COMPLETE_DATABASE_SCHEMA.sql
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING BUSINESS-RELATED FUNCTIONS
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
      AND routine_name NOT IN ('update_business_is_enabled', 'update_business_subscription', 'exec_sql')
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
-- STEP 2: REMOVE DEFAULT FROM isEnabled COLUMN
-- ============================================
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- ============================================
-- STEP 3: CREATE update_business_subscription FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_business_subscription(
  p_business_id TEXT,
  p_subscription JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN,
  subscription JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subscription JSONB;
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
  v_subscription JSONB;
BEGIN
  -- If status is 'active' and nextBillingDate is in the past, remove it
  -- This prevents auto-expire from immediately changing it back to 'expired'
  updated_subscription := p_subscription;
  IF updated_subscription->>'status' = 'active' AND updated_subscription->>'nextBillingDate' IS NOT NULL THEN
    -- Check if nextBillingDate is in the past
    IF (updated_subscription->>'nextBillingDate')::timestamp < NOW() THEN
      -- Remove nextBillingDate to prevent auto-expire
      updated_subscription := updated_subscription - 'nextBillingDate';
    END IF;
  END IF;
  
  -- Always remove nextBillingDate if status is 'active' to prevent auto-expire issues
  IF updated_subscription->>'status' = 'active' THEN
    updated_subscription := updated_subscription - 'nextBillingDate';
  END IF;
  
  -- Update the subscription directly - use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET subscription = updated_subscription
  WHERE b."businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch the updated values into variables
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."isEnabled",
    b.subscription
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- Verify the subscription was actually updated
  IF v_subscription->>'status' IS DISTINCT FROM updated_subscription->>'status' THEN
    RAISE EXCEPTION 'Update failed: expected status=%, but got %', 
      updated_subscription->>'status', 
      v_subscription->>'status';
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO authenticated;

-- ============================================
-- STEP 4: CREATE update_business_is_enabled FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_business_is_enabled(
  p_business_id TEXT,
  p_is_enabled BOOLEAN
)
RETURNS TABLE (
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
BEGIN
  -- Update directly - use explicit boolean value
  -- Use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled
  WHERE b."businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch the updated values into variables
  SELECT 
    b."businessId",
    b.name,
    b."isEnabled"
  INTO 
    v_business_id,
    v_name,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- Verify the value was actually updated
  IF v_is_enabled IS DISTINCT FROM p_is_enabled THEN
    RAISE EXCEPTION 'Update failed: expected isEnabled=%, but got %', p_is_enabled, v_is_enabled;
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_business_id,
    v_name,
    v_is_enabled;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- ============================================
-- STEP 5: VERIFY FUNCTIONS WERE CREATED
-- ============================================
SELECT 
  '✅ Functions created successfully' AS status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_business_is_enabled', 'update_business_subscription')
ORDER BY routine_name;

-- ============================================
-- DONE!
-- ============================================
-- Now test in your super-admin dashboard:
-- 1. Try to enable a business
-- 2. Check if isEnabled stays true
-- ============================================

