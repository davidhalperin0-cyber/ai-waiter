-- ============================================
-- Test update directly in database
-- Replace 'YOUR_BUSINESS_ID' with actual businessId
-- ============================================

-- Test 1: Update isEnabled
UPDATE businesses 
SET "isEnabled" = true
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled", subscription;

-- Test 2: Update subscription
UPDATE businesses 
SET subscription = jsonb_build_object(
  'status', 'active',
  'planType', 'menu_only'
)
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled", subscription;

-- Test 3: Update both
UPDATE businesses 
SET 
  "isEnabled" = false,
  subscription = jsonb_build_object(
    'status', 'trial',
    'planType', 'full'
  )
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING "businessId", name, "isEnabled", subscription;

-- Check if update persisted
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  subscription->>'status' as "status",
  subscription->>'planType' as "planType"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

