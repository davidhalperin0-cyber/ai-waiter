-- Add English category field for menu items
-- This allows displaying category names in English in the client menu.

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "category_en" TEXT;

COMMENT ON COLUMN "menuItems"."category_en" IS 'English display name for the menu category';


