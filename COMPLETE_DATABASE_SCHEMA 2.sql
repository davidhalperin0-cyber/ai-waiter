-- ============================================
-- COMPLETE DATABASE SCHEMA - QR Ordering SaaS
-- ============================================
-- Run this in Supabase SQL Editor to create/update all tables
-- This replaces all previous migration files
-- ============================================

-- ============================================
-- 1. BUSINESSES TABLE
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
    'bar', 'pizza' -- backward compatibility
  )),
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isEnabled" BOOLEAN,
  subscription JSONB NOT NULL DEFAULT '{"status": "trial", "planType": "full"}'::jsonb,
  "subscriptionlocked" BOOLEAN DEFAULT false,
  "printerConfig" JSONB DEFAULT '{"enabled": false, "type": "http", "endpoint": "", "payloadType": "json"}'::jsonb,
  "posConfig" JSONB DEFAULT '{"enabled": false, "endpoint": "", "method": "POST", "headers": {}, "timeoutMs": 5000}'::jsonb,
  menuStyle TEXT CHECK (menuStyle IS NULL OR menuStyle IN ('elegant', 'compact', 'bold')),
  "aiInstructions" TEXT,
  "logoUrl" TEXT,
  "businessHours" JSONB DEFAULT NULL,
  "customContent" JSONB DEFAULT '{
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
  }'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_subscription_status CHECK (
    (subscription->>'status') IN ('trial', 'active', 'expired', 'past_due')
  )
);

-- Add subscriptionlocked column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'subscriptionlocked'
  ) THEN
    ALTER TABLE businesses ADD COLUMN "subscriptionlocked" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_businessId ON businesses("businessId");
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_isEnabled ON businesses("isEnabled");

-- Businesses comments
COMMENT ON COLUMN businesses.menuStyle IS 'Menu content styling variant: elegant (default), compact, or bold. Independent from template theme.';
COMMENT ON COLUMN businesses."aiInstructions" IS 'Custom instructions for AI assistant (e.g., "Sushi items X, Y must be cooked, not raw")';
COMMENT ON COLUMN businesses."logoUrl" IS 'URL to business logo image';
COMMENT ON COLUMN businesses."businessHours" IS 'Operating hours for business menu items. Format: {"start": "10:00", "end": "18:00"} or null for always available.';
COMMENT ON COLUMN businesses."customContent" IS 'Custom content sections for menu: promotions, events, contact info, loyalty club, reviews, delivery options';
COMMENT ON COLUMN businesses."subscriptionlocked" IS 'If true, subscription cannot be auto-expired by system logic';

-- ============================================
-- 2. TABLES TABLE
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

-- Tables indexes
CREATE INDEX IF NOT EXISTS idx_tables_businessId ON tables("businessId");
CREATE INDEX IF NOT EXISTS idx_tables_tableId ON tables("tableId");

-- ============================================
-- 3. MENU ITEMS TABLE
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
  "isHidden" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", name),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- MenuItems indexes
CREATE INDEX IF NOT EXISTS idx_menuItems_businessId ON "menuItems"("businessId");
CREATE INDEX IF NOT EXISTS idx_menuItems_category ON "menuItems"(category);
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_featured" ON "menuItems"("businessId", "is_featured");
CREATE INDEX IF NOT EXISTS "idx_menuItems_is_pregnancy_safe" ON "menuItems"("businessId", "is_pregnancy_safe");
CREATE INDEX IF NOT EXISTS idx_menuItems_isBusiness ON "menuItems"("isBusiness") WHERE "isBusiness" = true;

-- MenuItems comments
COMMENT ON COLUMN "menuItems"."category_en" IS 'English display name for the menu category';
COMMENT ON COLUMN "menuItems"."name_en" IS 'English display name for the menu item';
COMMENT ON COLUMN "menuItems"."ingredients_en" IS 'Ingredients list in English (array of text)';
COMMENT ON COLUMN "menuItems"."allergens_en" IS 'Allergens list in English (array of text)';
COMMENT ON COLUMN "menuItems"."isBusiness" IS 'Marks menu item as business package (lunch deals, group packages, event menus)';

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  "orderId" TEXT UNIQUE NOT NULL,
  "businessId" TEXT NOT NULL,
  "tableId" TEXT NOT NULL,
  items JSONB NOT NULL,
  "aiSummary" TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'sent_to_printer', 'printed', 'printer_error', 'sent_to_pos', 'pos_error')),
  "totalAmount" NUMERIC(10, 2) NOT NULL CHECK ("totalAmount" >= 0),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders("orderId");
CREATE INDEX IF NOT EXISTS idx_orders_businessId ON orders("businessId");
CREATE INDEX IF NOT EXISTS idx_orders_tableId ON orders("tableId");
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- 5. RPC FUNCTION - Update Business Subscription
-- ============================================
-- This function is used by Super Admin to update subscriptions
-- It bypasses any RLS or trigger issues
DROP FUNCTION IF EXISTS update_business_subscription(TEXT, JSONB);

CREATE OR REPLACE FUNCTION update_business_subscription(
  p_business_id TEXT,
  p_subscription JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN,
  subscription JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subscription JSONB;
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
  v_subscription JSONB;
BEGIN
  -- If status is 'active' and nextBillingDate is in the past, remove it
  -- This prevents auto-expire from immediately changing it back to 'expired'
  updated_subscription := p_subscription;
  IF updated_subscription->>'status' = 'active' AND updated_subscription->>'nextBillingDate' IS NOT NULL THEN
    -- Check if nextBillingDate is in the past
    IF (updated_subscription->>'nextBillingDate')::timestamp < NOW() THEN
      -- Remove nextBillingDate to prevent auto-expire
      updated_subscription := updated_subscription - 'nextBillingDate';
    END IF;
  END IF;
  
  -- Always remove nextBillingDate if status is 'active' to prevent auto-expire issues
  IF updated_subscription->>'status' = 'active' THEN
    updated_subscription := updated_subscription - 'nextBillingDate';
  END IF;
  
  -- Update the subscription directly - use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET subscription = updated_subscription
  WHERE b."businessId" = p_business_id;
  
  -- Verify the update actually happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Fetch the updated values into variables
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."isEnabled",
    b.subscription
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- Verify the subscription was actually updated
  IF v_subscription->>'status' IS DISTINCT FROM updated_subscription->>'status' THEN
    RAISE EXCEPTION 'Update failed: expected status=%, but got %', 
      updated_subscription->>'status', 
      v_subscription->>'status';
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_id,
    v_business_id,
    v_name,
    v_is_enabled,
    v_subscription;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_subscription(TEXT, JSONB) TO authenticated;

-- ============================================
-- 6. FIX: Remove DEFAULT value from isEnabled column
-- ============================================
-- The DEFAULT true was causing updates to revert
-- Remove it so updates persist correctly
ALTER TABLE businesses ALTER COLUMN "isEnabled" DROP DEFAULT;

-- ============================================
-- 7. RPC FUNCTION - Update Business isEnabled
-- ============================================
-- This function is used by Super Admin to update isEnabled
-- It bypasses any RLS or trigger issues
DROP FUNCTION IF EXISTS update_business_is_enabled(TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION update_business_is_enabled(
  p_business_id TEXT,
  p_is_enabled BOOLEAN
)
RETURNS TABLE (
  "businessId" TEXT,
  name TEXT,
  "isEnabled" BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id TEXT;
  v_name TEXT;
  v_is_enabled BOOLEAN;
  update_count INTEGER;
BEGIN
  -- Update directly - use explicit boolean value
  -- Use table alias to avoid ambiguity
  UPDATE public.businesses b
  SET "isEnabled" = p_is_enabled::BOOLEAN
  WHERE b."businessId" = p_business_id;
  
  -- Get the number of rows updated
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Verify the update actually happened
  IF update_count = 0 THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- Force commit by doing a dummy operation that requires commit
  -- This ensures the transaction is committed before we read back
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.1);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE to lock the row and prevent concurrent modifications
  SELECT 
    b."businessId",
    b.name,
    b."isEnabled"
  INTO 
    v_business_id,
    v_name,
    v_is_enabled
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE;
  
  -- Verify the value was actually updated - use explicit comparison
  IF (v_is_enabled IS TRUE AND p_is_enabled IS FALSE) OR 
     (v_is_enabled IS FALSE AND p_is_enabled IS TRUE) THEN
    -- Try one more time with explicit cast
    UPDATE public.businesses b
    SET "isEnabled" = p_is_enabled::BOOLEAN
    WHERE b."businessId" = p_business_id;
    
    -- Fetch again
    SELECT b."isEnabled"
    INTO v_is_enabled
    FROM public.businesses b
    WHERE b."businessId" = p_business_id;
    
    -- If still doesn't match, raise exception
    IF (v_is_enabled IS TRUE AND p_is_enabled IS FALSE) OR 
       (v_is_enabled IS FALSE AND p_is_enabled IS TRUE) THEN
      RAISE EXCEPTION 'Update failed: expected isEnabled=%, but got %', p_is_enabled, v_is_enabled;
    END IF;
  END IF;
  
  -- Return the values
  RETURN QUERY
  SELECT 
    v_business_id,
    v_name,
    v_is_enabled;
END;
$$;

-- Grant execute permission


-- ============================================
-- 7. DISABLE ROW LEVEL SECURITY (if needed)
-- ============================================
-- Uncomment if RLS is causing issues:
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "menuItems" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SCHEMA SUMMARY
-- ============================================
-- Tables:
--   1. businesses - Business accounts with subscription, configs, and settings
--   2. tables - Table/QR code management
--   3. menuItems - Menu items with multi-language support
--   4. orders - Customer orders
--
-- Functions:
--   1. update_business_subscription - RPC function for Super Admin subscription updates
--   2. update_business_is_enabled - RPC function for Super Admin isEnabled updates
--
-- Key Features:
--   - Multi-language support (Hebrew + English)
--   - Featured items and business packages
--   - Pregnancy-safe flag
--   - Printer and POS integrations
--   - Menu styling variants
--   - Business hours for time-based items
--   - Custom content sections (promotions, events, contact, loyalty, reviews, delivery)
--   - subscriptionlocked flag to prevent auto-expire
-- ============================================
