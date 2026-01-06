-- ============================================
-- FIND AND DISABLE TRIGGER THAT CHANGES isEnabled BACK
-- ============================================
-- This script finds and disables any trigger that might be changing isEnabled back to true

-- 1. Check ALL triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2. Check for any functions that might be called by triggers
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

-- 3. Disable ALL triggers on businesses table temporarily
-- (We'll re-enable them if needed)
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

-- 4. Test update after disabling triggers
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5. Check if update persisted
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Wait and check again
SELECT pg_sleep(2);

SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. If it works, we found the problem - triggers are changing it back
-- If it still doesn't work, there's something else (maybe a view or materialized view)


