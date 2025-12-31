-- ============================================
-- Fix Database Schema - Safe Migration Script
-- This script safely adds all missing columns and constraints
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Create businesses table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isEnabled" BOOLEAN DEFAULT true,
  subscription JSONB NOT NULL DEFAULT '{"status": "trial", "planType": "full"}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Add missing columns to businesses table
-- ============================================

-- Add printerConfig
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'printerConfig'
  ) THEN
    ALTER TABLE businesses ADD COLUMN "printerConfig" JSONB DEFAULT '{"enabled": false, "type": "http", "endpoint": "", "payloadType": "json"}'::jsonb;
  END IF;
END $$;

-- Add posConfig
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'posConfig'
  ) THEN
    ALTER TABLE businesses ADD COLUMN "posConfig" JSONB DEFAULT '{"enabled": false, "endpoint": "", "method": "POST", "headers": {}, "timeoutMs": 5000}'::jsonb;
  END IF;
END $$;

-- Add menuStyle (check both camelCase and lowercase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' 
    AND (column_name = 'menuStyle' OR column_name = 'menustyle')
  ) THEN
    ALTER TABLE businesses ADD COLUMN menuStyle TEXT;
  END IF;
END $$;

-- Add aiInstructions (check both camelCase and lowercase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' 
    AND (column_name = 'aiInstructions' OR column_name = 'aiinstructions')
  ) THEN
    ALTER TABLE businesses ADD COLUMN "aiInstructions" TEXT;
  END IF;
END $$;

-- Add logoUrl (check both camelCase and lowercase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' 
    AND (column_name = 'logoUrl' OR column_name = 'logourl')
  ) THEN
    ALTER TABLE businesses ADD COLUMN "logoUrl" TEXT;
  END IF;
END $$;

-- Add businessHours (check both camelCase and lowercase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' 
    AND (column_name = 'businessHours' OR column_name = 'businesshours')
  ) THEN
    ALTER TABLE businesses ADD COLUMN "businessHours" JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add customContent (check both camelCase and lowercase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' 
    AND (column_name = 'customContent' OR column_name = 'customcontent')
  ) THEN
    ALTER TABLE businesses ADD COLUMN "customContent" JSONB DEFAULT '{
      "promotions": [],
      "events": {
        "enabled": false,
        "title": "",
        "description": "",
        "formFields": []
      },
      "contact": {
        "enabled": false,
        "title": "",
        "description": "",
        "phone": "",
        "email": "",
        "whatsapp": "",
        "instagram": "",
        "facebook": ""
      },
      "loyaltyClub": {
        "enabled": false,
        "title": "",
        "description": "",
        "benefits": []
      },
      "reviews": {
        "enabled": false,
        "title": "",
        "description": ""
      },
      "delivery": {
        "enabled": false,
        "title": "",
        "description": "",
        "link": ""
      }
    }'::jsonb;
  END IF;
END $$;

-- ============================================
-- 3. Add constraints to businesses table (only if they don't exist)
-- ============================================

-- Type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'businesses_type_check' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_type_check 
    CHECK (type IN ('bar', 'pizza', 'sushi', 'generic'));
  END IF;
END $$;

-- Template constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'businesses_template_check' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_template_check 
    CHECK (template IN (
      'bar-modern', 'bar-classic', 'bar-mid',
      'pizza-modern', 'pizza-classic', 'pizza-mid',
      'sushi', 'generic', 'gold',
      'bar', 'pizza'
    ));
  END IF;
END $$;

-- MenuStyle constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_menu_style' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT check_menu_style 
    CHECK (menuStyle IS NULL OR menuStyle IN ('elegant', 'compact', 'bold'));
  END IF;
END $$;

-- Subscription status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_subscription_status' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT valid_subscription_status 
    CHECK ((subscription->>'status') IN ('trial', 'active', 'expired', 'past_due'));
  END IF;
END $$;

-- ============================================
-- 4. Create tables table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS tables (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  label TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", "tableId")
);

-- Add foreign key if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tables'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tables_businessId_fkey' 
    AND table_name = 'tables'
  ) THEN
    ALTER TABLE tables 
    ADD CONSTRAINT tables_businessId_fkey 
    FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 5. Create menuItems table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS "menuItems" (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  "imageUrl" TEXT,
  price NUMERIC(10, 2) NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb,
  allergens JSONB DEFAULT '[]'::jsonb,
  "customizationOptions" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", name)
);

-- Add missing columns to menuItems
DO $$
BEGIN
  -- category_en
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'category_en'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "category_en" TEXT;
  END IF;
  
  -- name_en
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'name_en'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "name_en" TEXT;
  END IF;
  
  -- ingredients_en
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'ingredients_en'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "ingredients_en" TEXT[];
  END IF;
  
  -- allergens_en
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'allergens_en'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "allergens_en" TEXT[];
  END IF;
  
  -- is_featured
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "is_featured" BOOLEAN DEFAULT false;
  END IF;
  
  -- is_pregnancy_safe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' AND column_name = 'is_pregnancy_safe'
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "is_pregnancy_safe" BOOLEAN DEFAULT false;
  END IF;
  
  -- isBusiness (check both camelCase and lowercase)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menuItems' 
    AND (column_name = 'isBusiness' OR column_name = 'isbusiness')
  ) THEN
    ALTER TABLE "menuItems" ADD COLUMN "isBusiness" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add foreign key if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'menuItems'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'menuItems_businessId_fkey' 
    AND table_name = 'menuItems'
  ) THEN
    ALTER TABLE "menuItems" 
    ADD CONSTRAINT menuItems_businessId_fkey 
    FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE;
  END IF;
END $$;

-- Add price constraint if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'menuItems'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'menuItems_price_check' 
    AND conrelid = '"menuItems"'::regclass
  ) THEN
    ALTER TABLE "menuItems" ADD CONSTRAINT menuItems_price_check CHECK (price >= 0);
  END IF;
END $$;

-- ============================================
-- 6. Create orders table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  "orderId" TEXT UNIQUE NOT NULL,
  "businessId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  items JSONB NOT NULL,
  "aiSummary" TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  "totalAmount" NUMERIC(10, 2) NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_businessId_fkey' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT orders_businessId_fkey 
    FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE;
  END IF;
END $$;

-- Add status constraint if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_status_check' 
    AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('received', 'sent_to_printer', 'printed', 'printer_error', 'sent_to_pos', 'pos_error'));
  END IF;
END $$;

-- Add totalAmount constraint if it doesn't exist (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_totalAmount_check' 
    AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_totalAmount_check CHECK ("totalAmount" >= 0);
  END IF;
END $$;

-- ============================================
-- 7. Create indexes (safe - IF NOT EXISTS)
-- ============================================

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_businessId ON businesses("businessId");
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);

-- Tables indexes
CREATE INDEX IF NOT EXISTS idx_tables_businessId ON tables("businessId");
CREATE INDEX IF NOT EXISTS idx_tables_tableId ON tables("tableId");

-- MenuItems indexes
CREATE INDEX IF NOT EXISTS idx_menuItems_businessId ON "menuItems"("businessId");
CREATE INDEX IF NOT EXISTS idx_menuItems_category ON "menuItems"(category);
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_featured" ON "menuItems"("businessId", "is_featured");
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_pregnancy_safe" ON "menuItems"("businessId", "is_pregnancy_safe");
CREATE INDEX IF NOT EXISTS idx_menuItems_isBusiness ON "menuItems"("isBusiness") WHERE "isBusiness" = true;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders("orderId");
CREATE INDEX IF NOT EXISTS idx_orders_businessId ON orders("businessId");
CREATE INDEX IF NOT EXISTS idx_orders_tableId ON orders("tableId");
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt");

-- ============================================
-- 8. Add comments
-- ============================================
COMMENT ON COLUMN businesses.menuStyle IS 'Menu content styling variant: elegant (default), compact, or bold. Independent from template theme.';
COMMENT ON COLUMN businesses."aiInstructions" IS 'Custom instructions for AI assistant (e.g., "Sushi items X, Y must be cooked, not raw")';
COMMENT ON COLUMN businesses."logoUrl" IS 'URL to business logo image';
COMMENT ON COLUMN businesses."businessHours" IS 'Operating hours for business menu items. Format: {"start": "10:00", "end": "18:00"} or null for always available.';
COMMENT ON COLUMN businesses."customContent" IS 'Custom content sections for menu: promotions, events, contact info, loyalty club, reviews, delivery options';

COMMENT ON COLUMN "menuItems"."category_en" IS 'English display name for the menu category';
COMMENT ON COLUMN "menuItems"."name_en" IS 'English display name for the menu item';
COMMENT ON COLUMN "menuItems"."ingredients_en" IS 'Ingredients list in English (array of text)';
COMMENT ON COLUMN "menuItems"."allergens_en" IS 'Allergens list in English (array of text)';
COMMENT ON COLUMN "menuItems"."isBusiness" IS 'Marks menu item as business package (lunch deals, group packages, event menus)';

-- ============================================
-- Done! All tables and columns are now in place
-- ============================================

