-- ============================================
-- Fix subscription default value issue
-- This removes the default value that might be interfering
-- Run this in Supabase SQL Editor
-- ============================================

-- Remove the default value from subscription column
ALTER TABLE businesses 
ALTER COLUMN subscription DROP DEFAULT;

-- Verify the change
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'subscription';

