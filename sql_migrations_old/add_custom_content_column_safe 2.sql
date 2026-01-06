-- Add customContent column to businesses table (SAFE VERSION)
-- This version checks if the table exists first
-- This allows businesses to add custom content sections like promotions, events, contact info, reviews, etc.

-- Check if table exists, if not, create it with the column included
DO $$
BEGIN
  -- Check if businesses table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') THEN
    RAISE EXCEPTION 'Table "businesses" does not exist. Please run complete_schema.sql first to create all tables.';
  END IF;
END $$;

-- Now add the column (safe - won't fail if column already exists)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "customContent" JSONB DEFAULT '{
  "promotions": [],
  "events": {
    "enabled": false,
    "title": "",
    "description": "",
    "formFields": []
  },
  "contact": {
    "enabled": false,
    "title": "",
    "description": "",
    "phone": "",
    "email": "",
    "whatsapp": "",
    "instagram": "",
    "facebook": ""
  },
  "loyaltyClub": {
    "enabled": false,
    "title": "",
    "description": "",
    "benefits": []
  },
  "reviews": {
    "enabled": false,
    "title": "",
    "description": ""
  },
  "delivery": {
    "enabled": false,
    "title": "",
    "description": "",
    "link": ""
  }
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN businesses."customContent" IS 'Custom content sections for menu: promotions, events, contact info, loyalty club, reviews, delivery options';



