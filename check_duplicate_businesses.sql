-- ============================================
-- CHECK FOR DUPLICATE BUSINESSES
-- ============================================
-- This script checks if there are multiple rows
-- with the same businessId
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check for duplicate businessIds
SELECT 
  "businessId",
  COUNT(*) as count,
  array_agg(id ORDER BY "createdAt" DESC) as ids,
  array_agg(name ORDER BY "createdAt" DESC) as names,
  array_agg("createdAt" ORDER BY "createdAt" DESC) as created_dates
FROM businesses
GROUP BY "businessId"
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Check specific business
SELECT 
  id,
  "businessId",
  name,
  "createdAt",
  "isEnabled"
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded'
ORDER BY "createdAt" DESC;

-- 3. Check all businesses and their names
SELECT 
  id,
  "businessId",
  name,
  "createdAt"
FROM businesses
ORDER BY "createdAt" DESC
LIMIT 10;

-- 4. Check if UPDATE is working correctly
-- This will show the current state
SELECT 
  "businessId",
  name,
  "createdAt",
  "isEnabled"
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded';

