-- ============================================
-- TEST: RPC vs DIRECT UPDATE
-- ============================================
-- This compares RPC function vs direct UPDATE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. BEFORE - Current value
SELECT 
  '1_BEFORE' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Call RPC to set to FALSE
SELECT 
  '2_RPC_TO_FALSE' AS step,
  "businessId",
  "isEnabled"
FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  false::BOOLEAN
);

-- 3. Check immediately after RPC (same transaction)
SELECT 
  '3_AFTER_RPC' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 1 second
SELECT pg_sleep(1);

-- 5. Check after wait
SELECT 
  '4_AFTER_WAIT' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 6. Now try DIRECT UPDATE to FALSE
UPDATE businesses
SET "isEnabled" = false
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 7. Check after direct UPDATE
SELECT 
  '5_AFTER_DIRECT_UPDATE' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 8. Wait 1 second
SELECT pg_sleep(1);

-- 9. Check again
SELECT 
  '6_AFTER_DIRECT_WAIT' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 10. Now try RPC to set to TRUE
SELECT 
  '7_RPC_TO_TRUE' AS step,
  "businessId",
  "isEnabled"
FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  true::BOOLEAN
);

-- 11. Check immediately after RPC
SELECT 
  '8_AFTER_RPC_TRUE' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 12. Wait 1 second
SELECT pg_sleep(1);

-- 13. Check after wait
SELECT 
  '9_AFTER_RPC_TRUE_WAIT' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


