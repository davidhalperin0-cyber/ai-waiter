-- ============================================
-- FIX: Remove DEFAULT value from isEnabled column
-- ============================================
-- The DEFAULT true was causing updates to revert
-- This script removes the default so updates persist correctly

ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- Verify the change
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';


