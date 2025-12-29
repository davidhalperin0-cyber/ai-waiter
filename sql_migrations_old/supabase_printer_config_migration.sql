-- ============================================
-- Migration: Add Printer Configuration to Businesses
-- ============================================
-- Run this in Supabase SQL Editor to add printer config support
-- ============================================

-- Add printerConfig column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "printerConfig" JSONB DEFAULT '{
  "enabled": false,
  "type": "http",
  "endpoint": "",
  "payloadType": "json",
  "headers": {}
}'::jsonb;

-- ============================================
-- Migration completed!
-- ============================================

