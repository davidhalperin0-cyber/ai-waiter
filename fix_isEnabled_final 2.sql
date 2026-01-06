-- ============================================
-- FINAL FIX FOR isEnabled - DISABLE ALL TRIGGERS
-- ============================================
-- This script disables ALL triggers and fixes isEnabled completely

-- 1. Check current triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses';

-- 2. DISABLE ALL TRIGGERS on businesses table
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

-- 3. Remove DEFAULT from isEnabled
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- 4. Verify DEFAULT is removed
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 5. Update RPC function with better locking
DROP FUNCTION IF EXISTS update_business_is_enabled(TEXT, BOOLEAN);

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
  -- Lock the row and update
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled
  WHERE b."businessId" = p_business_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch immediately with lock
  SELECT 
    b."businessId",
    b.name,
    b."isEnabled"
  INTO 
    v_business_id,
    v_name,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_business_id,
    v_name,
    v_is_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_is_enabled(TEXT, BOOLEAN) TO authenticated;

-- 6. Test update
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', true);

-- 7. Check if it persisted
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Wait and check again
SELECT pg_sleep(2);

SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


