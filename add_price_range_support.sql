-- ============================================
-- ADD priceData COLUMN TO menuItems TABLE
-- ============================================
-- This allows storing price as either a single number or a range {min, max}
-- Run this in Supabase SQL Editor
-- ============================================

-- Add priceData column as JSONB to store price (number or {min, max} object)
ALTER TABLE "menuItems"
ADD COLUMN IF NOT EXISTS "priceData" JSONB;

-- Create index for better performance when querying
CREATE INDEX IF NOT EXISTS idx_menuItems_priceData ON "menuItems"("priceData") WHERE "priceData" IS NOT NULL;

-- Migrate existing price values to priceData
-- For existing items, priceData will be set to the numeric price value
UPDATE "menuItems"
SET "priceData" = to_jsonb("price")
WHERE "priceData" IS NULL;

-- Add comment
COMMENT ON COLUMN "menuItems"."priceData" IS 'Price data as JSONB: can be a number or {min: number, max: number} for price ranges';

