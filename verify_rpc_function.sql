-- Verify that the RPC function exists and is working
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_business_custom_content';

-- 2. Test the function with a sample update (optional - only if you want to test)
-- Replace 'YOUR_BUSINESS_ID' with an actual businessId from your database
/*
SELECT * FROM update_business_custom_content(
  'YOUR_BUSINESS_ID'::TEXT,
  '{"contact": {"enabled": true, "phone": "test", "email": "test@test.com"}}'::JSONB
);
*/

-- 3. Check the current customContent for a specific business
-- Replace 'YOUR_BUSINESS_ID' with an actual businessId
SELECT 
  "businessId",
  name,
  "customContent"->'contact'->>'phone' as phone,
  "customContent"->'contact'->>'email' as email,
  debug_last_writer
FROM businesses
WHERE "businessId" = 'YOUR_BUSINESS_ID';


