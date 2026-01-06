-- ============================================
-- FIX customContent COLUMN IN businesses TABLE
-- ============================================
-- This script ensures the customContent column exists
-- and is properly named (camelCase)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if customContent column exists (camelCase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'customContent'
  ) THEN
    -- Check if lowercase version exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'businesses' 
      AND column_name = 'customcontent'
    ) THEN
      -- Rename lowercase to camelCase
      ALTER TABLE businesses RENAME COLUMN customcontent TO "customContent";
      RAISE NOTICE 'Renamed customcontent to customContent';
    ELSE
      -- Create the column
      ALTER TABLE businesses ADD COLUMN "customContent" JSONB DEFAULT '{
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
        "menuButtonImageUrl": ""
      }'::jsonb;
      RAISE NOTICE 'Created customContent column';
    END IF;
  ELSE
    RAISE NOTICE 'customContent column already exists';
  END IF;
END $$;

-- 2. Verify the column exists and show its type
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND (column_name = 'customContent' OR column_name = 'customcontent')
ORDER BY column_name;

-- 3. Check if there are any businesses with null customContent and set default
UPDATE businesses
SET "customContent" = COALESCE(
  "customContent",
  '{
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
    "menuButtonImageUrl": ""
  }'::jsonb
)
WHERE "customContent" IS NULL;

-- 4. Show sample data to verify
SELECT 
  "businessId",
  name,
  "customContent" IS NOT NULL as has_custom_content,
  jsonb_typeof("customContent") as content_type
FROM businesses
LIMIT 5;


