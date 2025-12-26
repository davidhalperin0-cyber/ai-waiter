-- Add is_pregnancy_safe column to menuItems table
-- This allows businesses to mark items as safe for pregnancy

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "is_pregnancy_safe" BOOLEAN DEFAULT false;

-- Optional index if you want to query/filter by this flag
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_pregnancy_safe"
  ON "menuItems"("businessId", "is_pregnancy_safe");







