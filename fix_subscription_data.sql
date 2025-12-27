-- ============================================
-- Fix corrupted subscription data
-- This script will fix any malformed subscription JSONB data
-- ============================================

-- First, let's see what's wrong with the subscription data
SELECT 
  "businessId",
  name,
  subscription,
  subscription::text as "subscription_text",
  jsonb_typeof(subscription) as "subscription_type"
FROM businesses
WHERE subscription::text LIKE '%activ active%'
   OR subscription::text NOT LIKE '{%}%'
   OR jsonb_typeof(subscription) != 'object';

-- Fix malformed subscription data
-- This will set subscription to a valid default if it's corrupted
UPDATE businesses
SET subscription = jsonb_build_object(
  'status', COALESCE(subscription->>'status', 'trial'),
  'planType', COALESCE(subscription->>'planType', 'full')
)
WHERE subscription::text LIKE '%activ active%'
   OR subscription::text NOT LIKE '{%}%'
   OR jsonb_typeof(subscription) != 'object'
   OR subscription IS NULL;

-- Verify the fix
SELECT 
  "businessId",
  name,
  subscription,
  subscription->>'status' as "status",
  subscription->>'planType' as "planType"
FROM businesses
ORDER BY "createdAt" DESC;

