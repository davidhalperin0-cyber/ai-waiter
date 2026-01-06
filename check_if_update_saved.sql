-- Check if the update was actually saved in the database
-- Run this RIGHT AFTER updating through the API
-- Replace with your businessId

SELECT 
  "businessId",
  name,
  "customContent"->'contact'->>'phone' as phone,
  "customContent"->'contact'->>'email' as email,
  "customContent"->'contact'->>'whatsapp' as whatsapp,
  "customContent"->'contact'->>'instagram' as instagram,
  "customContent"->'contact'->>'facebook' as facebook,
  debug_last_writer,
  "customContent"->'contact' as contact_object
FROM businesses
WHERE "businessId" = '7f551d3e-f048-48cf-8ce2-53973a378ded';

-- Compare the values above with what was sent in the API request
-- Expected values from the logs:
-- phone: '0507816577678967890-'
-- email: '234567'
-- whatsapp: '12345567890-'
-- instagram: '12345678'
-- facebook: '123467890'
-- debug_last_writer: 'RPC:update_business_custom_content'


