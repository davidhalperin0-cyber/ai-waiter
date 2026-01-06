-- Add customContent column ONLY (safe for existing databases)
-- This script only adds the customContent column if it doesn't exist
-- Run this if your businesses table already exists

-- Add the column if it doesn't exist
DO $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'customContent'
  ) THEN
    -- Add the column
    ALTER TABLE businesses 
    ADD COLUMN "customContent" JSONB DEFAULT '{
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
    
    -- Add comment
    COMMENT ON COLUMN businesses."customContent" IS 'Custom content sections for menu: promotions, events, contact info, loyalty club, reviews, delivery options';
    
    RAISE NOTICE 'Column customContent added successfully';
  ELSE
    RAISE NOTICE 'Column customContent already exists, skipping...';
  END IF;
END $$;



