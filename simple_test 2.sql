-- ============================================
-- SIMPLE TEST - Does RPC work?
-- ============================================
-- Run this and send me ALL results
-- ============================================

-- 1. BEFORE - Current value
SELECT 
  '1_BEFORE' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Call RPC to set to TRUE
SELECT 
  '2_RPC_RESULT' AS step,
  "businessId",
  "isEnabled"
FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  true::BOOLEAN
);

-- 3. Check immediately after RPC
SELECT 
  '3_AFTER_RPC' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 4. Wait 2 seconds
SELECT pg_sleep(2);

-- 5. Check after wait
SELECT 
  '4_AFTER_WAIT' AS step,
  "businessId",
  "isEnabled"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';


