-- ============================================
-- ADD isHidden COLUMN TO menuItems TABLE
-- ============================================
-- This script adds the isHidden column to the menuItems table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add isHidden column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'menuItems' 
    AND column_name = 'isHidden'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "isHidden" BOOLEAN DEFAULT false;
    
    -- Add comment
    COMMENT ON COLUMN "menuItems"."isHidden" IS 'If true, item is hidden from customer menu but visible in dashboard';
  END IF;
END $$;

-- Create index for filtering hidden items
CREATE INDEX IF NOT EXISTS idx_menuItems_isHidden ON "menuItems"("businessId", "isHidden") WHERE "isHidden" = false;


