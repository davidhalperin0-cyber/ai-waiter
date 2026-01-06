-- Add password reset columns to businesses table
-- Run this in Supabase SQL Editor

-- Add passwordResetToken column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'passwordResetToken'
  ) THEN
    ALTER TABLE businesses ADD COLUMN "passwordResetToken" TEXT;
  END IF;
END $$;

-- Add passwordResetExpiry column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'passwordResetExpiry'
  ) THEN
    ALTER TABLE businesses ADD COLUMN "passwordResetExpiry" TIMESTAMPTZ;
  END IF;
END $$;

-- Add index on passwordResetToken for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_password_reset_token ON businesses("passwordResetToken") WHERE "passwordResetToken" IS NOT NULL;

-- Add comments
COMMENT ON COLUMN businesses."passwordResetToken" IS 'Temporary token for password reset (valid for 1 hour)';
COMMENT ON COLUMN businesses."passwordResetExpiry" IS 'Expiry timestamp for password reset token';

