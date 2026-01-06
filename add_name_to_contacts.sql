-- ============================================
-- ADD NAME COLUMN TO CONTACTS TABLE
-- ============================================
-- Add name field to contacts table for loyalty club signups
-- ============================================

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

-- Update constraint: phone should be unique per business, but name+phone combination can be used for better deduplication
-- For now, keeping phone unique per business as before

-- Update comment
COMMENT ON COLUMN contacts.name IS 'Contact name (required)';


