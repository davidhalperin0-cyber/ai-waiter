-- ============================================
-- Script to check for DB triggers and policies
-- that might be modifying subscription
-- Run this in Supabase SQL Editor
-- ============================================

-- 1️⃣ Check for triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2️⃣ Check for RLS policies that might affect updates
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses';

-- 3️⃣ Check for functions that might be called automatically
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname LIKE '%subscription%'
   OR proname LIKE '%business%'
ORDER BY proname;

-- 4️⃣ Check current subscription value for specific business
-- Replace 'b72bca1a-7fd3-470d-998e-971785f30ab4' with your businessId
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  subscription->>'status' as subscription_status,
  subscription->>'planType' as subscription_planType,
  subscriptionlocked,
  "createdAt"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5️⃣ Check all columns in businesses table
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
ORDER BY column_name;

-- 6️⃣ Check for any BEFORE/AFTER UPDATE triggers specifically
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND event_manipulation = 'UPDATE'
  AND (action_timing = 'BEFORE' OR action_timing = 'AFTER');

-- 7️⃣ Test: Try to update subscription directly and see what happens
-- WARNING: This will actually update the DB, so be careful!
-- Uncomment only if you want to test:
/*
UPDATE businesses
SET subscription = '{"status": "past_due", "planType": "menu_only"}'::jsonb
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4'
RETURNING 
  "businessId",
  subscription,
  subscription->>'status' as status,
  subscriptionlocked;

-- Wait 2 seconds, then check again
SELECT 
  "businessId",
  subscription,
  subscription->>'status' as status,
  subscriptionlocked
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';
*/

