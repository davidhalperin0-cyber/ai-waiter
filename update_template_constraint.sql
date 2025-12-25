-- Update template constraint to support all new theme options
-- Run this in Supabase SQL Editor

-- First, drop the old constraint
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS businesses_template_check;

-- Add new constraint with all theme options
ALTER TABLE businesses
ADD CONSTRAINT businesses_template_check 
CHECK (template IN (
  'bar-modern', 'bar-classic', 'bar-mid',
  'pizza-modern', 'pizza-classic', 'pizza-mid',
  'sushi', 'generic', 'gold',
  -- Keep old values for backward compatibility
  'bar', 'pizza'
));

-- Update existing 'bar' to 'bar-modern' and 'pizza' to 'pizza-modern'
UPDATE businesses 
SET template = 'bar-modern' 
WHERE template = 'bar';

UPDATE businesses 
SET template = 'pizza-modern' 
WHERE template = 'pizza';




