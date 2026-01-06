-- ============================================
-- DISABLE ALL AUTO-UPDATES OF isEnabled
-- ============================================
-- This script disables ALL logic that automatically updates isEnabled
-- Run this AFTER finding what needs to be disabled
-- ⚠️ WARNING: Run find_all_isEnabled_auto_updates.sql first!

-- ============================================
-- 1. DISABLE ALL TRIGGERS ON businesses TABLE
-- ============================================
DO $$
DECLARE
  r RECORD;
  disabled_count INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'businesses'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE businesses DISABLE TRIGGER %I', r.trigger_name);
      RAISE NOTICE '✅ Disabled trigger: %', r.trigger_name;
      disabled_count := disabled_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to disable trigger %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
  
  IF disabled_count = 0 THEN
    RAISE NOTICE 'ℹ️ No triggers found to disable';
  ELSE
    RAISE NOTICE '✅ Disabled % trigger(s)', disabled_count;
  END IF;
END $$;

-- ============================================
-- 2. REMOVE DEFAULT VALUE FROM isEnabled
-- ============================================
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- Verify DEFAULT is removed
SELECT 
  'DEFAULT_REMOVED' AS action,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- ============================================
-- 3. ENSURE isEnabled CANNOT BE AUTO-UPDATED
-- ============================================
-- Add a comment to document this rule
COMMENT ON COLUMN businesses."isEnabled" IS 'Admin-controlled only. Must NOT be automatically updated by triggers, functions, or subscription status.';

-- ============================================
-- 4. VERIFY: Test that isEnabled persists after subscription update
-- ============================================
-- Set isEnabled to false
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- Update subscription
SELECT * FROM update_business_subscription(
  'b72bca1a-7fd3-470d-998e-971785f30ab4',
  '{"status": "active", "planType": "menu_only"}'::jsonb
);

-- Check if isEnabled stayed false
SELECT 
  'VERIFICATION' AS test,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  CASE 
    WHEN "isEnabled" = false THEN '✅ PASS: isEnabled stayed false'
    ELSE '❌ FAIL: isEnabled was changed to true'
  END AS result
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


