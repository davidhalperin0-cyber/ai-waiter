-- Check for triggers that might prevent customContent from being saved
-- Run this in Supabase SQL Editor

-- 1. Check all triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2. Check if there are any BEFORE UPDATE triggers that might modify customContent
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM information_schema.triggers t
JOIN pg_trigger tr ON tr.tgname = t.trigger_name
JOIN pg_proc p ON p.oid = tr.tgfoid
WHERE t.event_object_table = 'businesses'
  AND t.action_timing = 'BEFORE'
  AND t.event_manipulation = 'UPDATE'
ORDER BY t.trigger_name;

-- 3. Check the actual data in the database RIGHT NOW
SELECT 
  "businessId",
  name,
  "customContent"->'contact'->>'phone' as phone,
  "customContent"->'contact'->>'email' as email,
  "customContent"->'contact'->>'whatsapp' as whatsapp,
  "customContent"->'contact'->>'instagram' as instagram,
  "customContent"->'contact'->>'facebook' as facebook
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded';

-- 4. Try to update directly in SQL to see if it works
-- This will help us understand if the problem is with the RPC function or with triggers
UPDATE businesses
SET "customContent" = jsonb_set(
  COALESCE("customContent", '{}'::jsonb),
  '{contact}',
  '{"enabled": true, "phone": "TEST123", "email": "TEST@test.com", "whatsapp": "TEST", "instagram": "TEST", "facebook": "TEST"}'::jsonb
)
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded'
RETURNING 
  "customContent"->'contact'->>'phone' as phone,
  "customContent"->'contact'->>'email' as email;

