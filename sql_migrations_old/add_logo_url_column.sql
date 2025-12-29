-- Add logoUrl column to businesses table
-- Run this in Supabase SQL Editor

-- Check if column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'logoUrl'
  ) THEN
    -- Add logoUrl column
    ALTER TABLE businesses
    ADD COLUMN "logoUrl" TEXT;
    
    RAISE NOTICE 'logoUrl column added successfully';
  ELSE
    RAISE NOTICE 'logoUrl column already exists';
  END IF;
END $$;






