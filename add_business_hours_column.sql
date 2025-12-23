-- Add businessHours column to businesses table
-- This column stores the operating hours for business menu items
-- Format: JSONB with { start: "10:00", end: "18:00" } or null for always available

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS "businessHours" JSONB DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN businesses."businessHours" IS 'Operating hours for business menu items. Format: {"start": "10:00", "end": "18:00"} or null for always available.';

