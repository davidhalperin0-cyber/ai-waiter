-- Add English fields for menu items (multi-language support)
-- These columns store English versions of the menu content, alongside the Hebrew fields.
-- They are optional and can be filled gradually per item.

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "name_en" TEXT;

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "ingredients_en" TEXT[];

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "allergens_en" TEXT[];

-- Comments for documentation
COMMENT ON COLUMN "menuItems"."name_en" IS 'English display name for the menu item';
COMMENT ON COLUMN "menuItems"."ingredients_en" IS 'Ingredients list in English (array of text)';
COMMENT ON COLUMN "menuItems"."allergens_en" IS 'Allergens list in English (array of text)';



