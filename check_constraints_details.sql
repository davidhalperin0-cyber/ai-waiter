-- Check the details of all constraints on businesses table
-- Run this in Supabase SQL Editor

-- 1. Get full constraint definitions
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'businesses'
  AND nsp.nspname = 'public'
ORDER BY con.conname;

-- 2. Check if any constraint affects customContent
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'businesses'
  AND nsp.nspname = 'public'
  AND pg_get_constraintdef(con.oid) ILIKE '%customContent%'
  OR pg_get_constraintdef(con.oid) ILIKE '%customcontent%'
  OR pg_get_constraintdef(con.oid) ILIKE '%instagram%';

-- 3. Check the actual data directly from the database
SELECT 
  "businessId",
  name,
  jsonb_typeof("customContent") as content_type,
  "customContent"->'contact'->>'instagram' as instagram_value,
  length("customContent"->'contact'->>'instagram') as instagram_length,
  octet_length("customContent"->'contact'->>'instagram') as instagram_bytes,
  "customContent"->'contact' as contact_object,
  jsonb_pretty("customContent"->'contact') as contact_pretty
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded';

-- 4. Try to update directly in SQL to see if it works
-- (Don't run this unless you want to test - it will update the data)
/*
UPDATE businesses
SET "customContent" = jsonb_set(
  "customContent",
  '{contact,instagram}',
  '"עfhuiחלך"'
)
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded'
RETURNING 
  "customContent"->'contact'->>'instagram' as instagram_value,
  length("customContent"->'contact'->>'instagram') as instagram_length;
*/


