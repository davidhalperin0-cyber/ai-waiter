-- Find all business IDs in the database
-- Run this in Supabase SQL Editor to see all available business IDs

SELECT 
  "businessId",
  name,
  "customContent"->'contact'->>'phone' as phone,
  "customContent"->'contact'->>'email' as email,
  debug_last_writer
FROM businesses
ORDER BY name
LIMIT 20;

-- Or if you want to see just the IDs:
-- SELECT "businessId", name FROM businesses LIMIT 20;


