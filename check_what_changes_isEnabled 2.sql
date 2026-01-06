-- ============================================
-- CHECK WHAT CHANGES isEnabled AUTOMATICALLY
-- ============================================
-- This script checks for any automatic changes to isEnabled
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check current value
SELECT 
  'CURRENT_VALUE' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 2. Set to false via RPC
SELECT * FROM update_business_is_enabled(
  'b72bca1a-7fd3-470d-998e-971785f30ab4'::TEXT,
  false::BOOLEAN
);

-- 3. Wait 2 seconds
SELECT pg_sleep(2);

-- 4. Check again - did it change back?
SELECT 
  'AFTER_2_SEC' AS phase,
  "businessId",
  "isEnabled",
  subscription->>'status' AS subscription_status,
  "subscriptionlocked"
FROM businesses
WHERE "businessId" = 'b72bca1a-7fd3-470d-998e-971785f30ab4';

-- 5. Check if there are any active connections that might be holding locks
SELECT 
  'ACTIVE_CONNECTIONS' AS phase,
  pid,
  usename,
  application_name,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY query_start DESC;

-- 6. Check for any pending transactions
SELECT 
  'PENDING_TRANSACTIONS' AS phase,
  pid,
  usename,
  application_name,
  xact_start,
  state,
  query
FROM pg_stat_activity
WHERE datname = current_database()
  AND xact_start IS NOT NULL
  AND pid != pg_backend_pid()
ORDER BY xact_start DESC;


