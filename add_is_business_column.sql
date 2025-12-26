-- Add isBusiness column to menuItems table
-- This column marks menu items as business packages (lunch deals, group packages, event menus)

ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "isBusiness" BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN "menuItems"."isBusiness" IS 'Marks menu item as business package (lunch deals, group packages, event menus)';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_menuItems_isBusiness ON "menuItems"("isBusiness") WHERE "isBusiness" = true;



