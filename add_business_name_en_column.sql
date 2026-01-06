-- Add English name field for businesses (multi-language support)
-- This column stores English version of the business name, alongside the Hebrew name.
-- It is optional and can be filled gradually per business.

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Comment for documentation
COMMENT ON COLUMN businesses.name_en IS 'English display name for the business';


