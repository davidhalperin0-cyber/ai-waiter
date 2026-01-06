-- ============================================
-- COMPLETE FIX FOR isEnabled ISSUE
-- ============================================
-- This script completely fixes the isEnabled issue

-- 1. Check current DEFAULT value
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 2. REMOVE DEFAULT if it still exists
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- 3. Verify DEFAULT is removed
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';

-- 4. Check current value
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5. Update using RPC function
SELECT * FROM update_business_is_enabled('b72bca1a-7fd3-470d-998e-971785f30ab4', false);

-- 6. Check immediately
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Wait 3 seconds
SELECT pg_sleep(3);

-- 8. Check again
SELECT 
  "businessId",
  name,
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 9. If it's still false, the fix worked!
-- If it changed back to true, there's something else (maybe a view or RLS policy)


