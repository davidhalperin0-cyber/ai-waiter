-- ============================================
-- Complete Supabase Database Schema
-- QR Ordering SaaS - Full Schema with All Columns
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Businesses Table
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bar', 'pizza', 'sushi', 'generic')),
  template TEXT NOT NULL CHECK (template IN (
    'bar-modern', 'bar-classic', 'bar-mid',
    'pizza-modern', 'pizza-classic', 'pizza-mid',
    'sushi', 'generic', 'gold',
    -- Keep old values for backward compatibility
    'bar', 'pizza'
  )),
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isEnabled" BOOLEAN DEFAULT true,
  subscription JSONB NOT NULL DEFAULT '{"status": "trial", "planType": "full"}'::jsonb,
  "printerConfig" JSONB DEFAULT '{"enabled": false, "type": "http", "endpoint": "", "payloadType": "json"}'::jsonb,
  "posConfig" JSONB DEFAULT '{"enabled": false, "endpoint": "", "method": "POST", "headers": {}, "timeoutMs": 5000}'::jsonb,
  menuStyle TEXT CHECK (menuStyle IS NULL OR menuStyle IN ('elegant', 'compact', 'bold')),
  "aiInstructions" TEXT,
  "logoUrl" TEXT,
  "businessHours" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_subscription_status CHECK (
    (subscription->>'status') IN ('trial', 'active', 'expired', 'past_due')
  )
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_businessId ON businesses("businessId");
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);

-- Comments for businesses
COMMENT ON COLUMN businesses.menuStyle IS 'Menu content styling variant: elegant (default), compact, or bold. Independent from template theme.';
COMMENT ON COLUMN businesses."aiInstructions" IS 'Custom instructions for AI assistant (e.g., "Sushi items X, Y must be cooked, not raw")';
COMMENT ON COLUMN businesses."logoUrl" IS 'URL to business logo image';
COMMENT ON COLUMN businesses."businessHours" IS 'Operating hours for business menu items. Format: {"start": "10:00", "end": "18:00"} or null for always available.';

-- ============================================
-- 2. Tables Table
-- ============================================
CREATE TABLE IF NOT EXISTS tables (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  label TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", "tableId"),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- Indexes for tables
CREATE INDEX IF NOT EXISTS idx_tables_businessId ON tables("businessId");
CREATE INDEX IF NOT EXISTS idx_tables_tableId ON tables("tableId");

-- ============================================
-- 3. Menu Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS "menuItems" (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  category TEXT NOT NULL,
  "category_en" TEXT,
  name TEXT NOT NULL,
  "name_en" TEXT,
  "imageUrl" TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  ingredients JSONB DEFAULT '[]'::jsonb,
  "ingredients_en" TEXT[],
  allergens JSONB DEFAULT '[]'::jsonb,
  "allergens_en" TEXT[],
  "customizationOptions" JSONB DEFAULT '[]'::jsonb,
  "is_featured" BOOLEAN DEFAULT false,
  "is_pregnancy_safe" BOOLEAN DEFAULT false,
  "isBusiness" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", name),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- Indexes for menuItems
CREATE INDEX IF NOT EXISTS idx_menuItems_businessId ON "menuItems"("businessId");
CREATE INDEX IF NOT EXISTS idx_menuItems_category ON "menuItems"(category);
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_featured" ON "menuItems"("businessId", "is_featured");
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_pregnancy_safe" ON "menuItems"("businessId", "is_pregnancy_safe");
CREATE INDEX IF NOT EXISTS idx_menuItems_isBusiness ON "menuItems"("isBusiness") WHERE "isBusiness" = true;

-- Comments for menuItems
COMMENT ON COLUMN "menuItems"."category_en" IS 'English display name for the menu category';
COMMENT ON COLUMN "menuItems"."name_en" IS 'English display name for the menu item';
COMMENT ON COLUMN "menuItems"."ingredients_en" IS 'Ingredients list in English (array of text)';
COMMENT ON COLUMN "menuItems"."allergens_en" IS 'Allergens list in English (array of text)';
COMMENT ON COLUMN "menuItems"."isBusiness" IS 'Marks menu item as business package (lunch deals, group packages, event menus)';

-- ============================================
-- 4. Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  "orderId" TEXT UNIQUE NOT NULL,
  "businessId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  items JSONB NOT NULL,
  "aiSummary" TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'sent_to_printer', 'printed', 'printer_error')),
  "totalAmount" NUMERIC(10, 2) NOT NULL CHECK ("totalAmount" >= 0),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders("orderId");
CREATE INDEX IF NOT EXISTS idx_orders_businessId ON orders("businessId");
CREATE INDEX IF NOT EXISTS idx_orders_tableId ON orders("tableId");
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt");

-- ============================================
-- Optional: Enable Row Level Security (RLS)
-- ============================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "menuItems" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Schema Summary
-- ============================================
-- Tables:
--   1. businesses - Business accounts with subscription, configs, and settings
--   2. tables - Table/QR code management
--   3. menuItems - Menu items with multi-language support
--   4. orders - Customer orders
--
-- Key Features:
--   - Multi-language support (Hebrew + English)
--   - Featured items and business packages
--   - Pregnancy-safe flag
--   - Printer and POS integrations
--   - Menu styling variants
--   - Business hours for time-based items
-- ============================================


