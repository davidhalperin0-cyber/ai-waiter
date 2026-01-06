-- Add debug column to track who writes to businesses table last
-- This will help us identify which code path is overwriting customContent after RPC
-- Run this in Supabase SQL Editor

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS debug_last_writer TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_businesses_debug_last_writer 
ON businesses(debug_last_writer) 
WHERE debug_last_writer IS NOT NULL;


