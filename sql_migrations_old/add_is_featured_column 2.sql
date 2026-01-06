-- Add is_featured column to menuItems table
-- This allows businesses to mark items as "featured" or "deals" for the carousel

ALTER TABLE "menuItems" 
ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_featured" ON "menuItems"("businessId", "is_featured");







