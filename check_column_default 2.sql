-- ============================================
-- CHECK COLUMN DEFAULT AND CONSTRAINTS
-- ============================================
-- This checks if there's a DEFAULT value on isEnabled
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check current DEFAULT value
SELECT 
  'COLUMN_INFO' AS type,
  column_name,
  column_default,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 2. Check all constraints on isEnabled
SELECT 
  'CONSTRAINT' AS type,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
  AND (
    pg_get_constraintdef(oid) ILIKE '%isEnabled%'
    OR pg_get_constraintdef(oid) ILIKE '%is_enabled%'
  )
ORDER BY conname;

-- 3. Try to remove DEFAULT if it exists
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- 4. Verify DEFAULT was removed
SELECT 
  'AFTER_DROP_DEFAULT' AS type,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 5. Test: Set to false and check
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

SELECT 
  'AFTER_SET_FALSE' AS phase,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Check current value
SELECT 
  'CURRENT_VALUE' AS phase,
  "businessId",
  "isEnabled",
  "isEnabled" IS NULL AS is_null,
  "isEnabled" IS NOT NULL AS is_not_null
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

