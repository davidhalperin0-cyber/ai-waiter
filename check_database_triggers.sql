-- Check for triggers or functions that might modify customContent
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

-- 2. Check all functions that might affect customContent
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%customContent%' 
    OR routine_definition ILIKE '%customcontent%'
    OR routine_definition ILIKE '%instagram%'
  )
ORDER BY routine_name;

-- 3. Check the actual data in the database
SELECT 
  "businessId",
  name,
  jsonb_typeof("customContent") as content_type,
  "customContent"->'contact'->>'instagram' as instagram_value,
  length("customContent"->'contact'->>'instagram') as instagram_length,
  "customContent"->'contact' as contact_object
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded';

-- 4. Check if there are any constraints on customContent
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'businesses'
  AND constraint_type IN ('CHECK', 'FOREIGN KEY');


