-- ============================================
-- Add printerConfig column to businesses table
-- ============================================
-- Run this in Supabase SQL Editor if the column doesn't exist
-- ============================================

-- Check if column exists (optional - just for verification)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' AND column_name = 'printerConfig';

-- Add printerConfig column if it doesn't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "printerConfig" JSONB DEFAULT '{"enabled": false, "type": "http", "endpoint": "", "payloadType": "json"}'::jsonb;

-- Verify it was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'businesses' AND column_name = 'printerConfig';

-- ============================================
-- Done! The printerConfig column is now added.
-- ============================================





