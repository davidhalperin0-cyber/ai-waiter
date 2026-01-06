-- ============================================
-- ADD sortOrder COLUMN TO menuItems TABLE
-- ============================================
-- This allows custom ordering of menu items
-- Run this in Supabase SQL Editor
-- ============================================

-- Add sortOrder column if it doesn't exist
ALTER TABLE "menuItems" 
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

-- Create index for better performance when sorting
CREATE INDEX IF NOT EXISTS idx_menuItems_sortOrder ON "menuItems"("businessId", "sortOrder");

-- Set initial sortOrder based on createdAt (oldest first)
-- This ensures existing items have a proper order
UPDATE "menuItems"
SET "sortOrder" = subquery.row_number
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY "businessId" ORDER BY "createdAt" ASC) as row_number
  FROM "menuItems"
) AS subquery
WHERE "menuItems".id = subquery.id;

-- Add comment
COMMENT ON COLUMN "menuItems"."sortOrder" IS 'Custom sort order for menu items. Lower numbers appear first.';

