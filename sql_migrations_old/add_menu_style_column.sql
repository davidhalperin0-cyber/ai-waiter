-- Add menuStyle column to businesses table
-- This column stores the menu content styling variant (elegant, compact, bold)
-- Independent from template (which controls background/theme)

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS menuStyle TEXT;

-- Add constraint to ensure only valid values (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_menu_style' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses
    ADD CONSTRAINT check_menu_style 
    CHECK (menuStyle IS NULL OR menuStyle IN ('elegant', 'compact', 'bold'));
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN businesses.menuStyle IS 'Menu content styling variant: elegant (default), compact, or bold. Independent from template theme.';



