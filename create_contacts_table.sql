-- ============================================
-- CREATE CONTACTS TABLE
-- ============================================
-- This table stores contacts/leads from the loyalty club signup
-- NO users, NO authentication, NO passwords
-- Simple contact collection system
-- ============================================

-- Drop existing contacts table if it exists (clean rebuild)
DROP TABLE IF EXISTS contacts CASCADE;

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'loyalty_club',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_phone_per_business UNIQUE (business_id, phone),
  CONSTRAINT valid_source CHECK (source = 'loyalty_club')
);

-- Indexes for performance
CREATE INDEX idx_contacts_business_id ON contacts(business_id);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_source ON contacts(source);

-- Comments for documentation
COMMENT ON TABLE contacts IS 'Contact/lead collection from loyalty club signups. No authentication required.';
COMMENT ON COLUMN contacts.business_id IS 'References businesses.businessId (TEXT)';
COMMENT ON COLUMN contacts.phone IS 'Phone number (required, unique per business)';
COMMENT ON COLUMN contacts.email IS 'Email address (optional)';
COMMENT ON COLUMN contacts.source IS 'Source of contact (currently only: loyalty_club)';
COMMENT ON COLUMN contacts.created_at IS 'When contact was first created';
COMMENT ON COLUMN contacts.updated_at IS 'When contact was last updated (if phone already existed)';


