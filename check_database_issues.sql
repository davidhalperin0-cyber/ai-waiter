-- ============================================
-- Script to check for database issues preventing updates
-- Run this in Supabase SQL Editor to diagnose the problem
-- ============================================

-- 1. Check if RLS is enabled (this could block updates)
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'businesses';

-- 2. Check for triggers that might be interfering
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'businesses';

-- 3. Check the actual constraint on subscription
SELECT 
  conname as "Constraint Name",
  pg_get_constraintdef(oid) as "Constraint Definition"
FROM pg_constraint
WHERE conrelid = 'businesses'::regclass
AND conname LIKE '%subscription%';

-- 4. Check current subscription values for a specific business
-- Replace 'YOUR_BUSINESS_ID' with an actual businessId
SELECT 
  "businessId",
  name,
  "isEnabled",
  subscription,
  subscription->>'status' as "subscription_status",
  subscription->>'planType' as "subscription_planType"
FROM businesses
ORDER BY "createdAt" DESC
LIMIT 10;

-- 5. Test update directly (replace with your businessId)
-- This will help us see if the update works at the database level
/*
UPDATE businesses 
SET 
  "isEnabled" = true,
  subscription = '{"status": "active", "planType": "full"}'::jsonb
WHERE "businessId" = 'YOUR_BUSINESS_ID'
RETURNING "businessId", name, "isEnabled", subscription;
*/

-- 6. Check if there are any policies blocking updates
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

