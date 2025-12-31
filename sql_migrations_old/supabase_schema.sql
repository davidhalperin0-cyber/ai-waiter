-- ============================================
-- Supabase Database Schema for QR Ordering SaaS
-- ============================================
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bar', 'pizza', 'sushi', 'generic')),
  template TEXT NOT NULL CHECK (template IN ('bar', 'pizza', 'sushi', 'generic')),
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isEnabled" BOOLEAN DEFAULT true,
  subscription JSONB NOT NULL DEFAULT '{"status": "trial", "tablesAllowed": 10}'::jsonb,
  "printerConfig" JSONB DEFAULT '{"enabled": false, "type": "http", "endpoint": "", "payloadType": "json"}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_subscription_status CHECK (
    (subscription->>'status') IN ('trial', 'active', 'expired', 'past_due')
  )
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_businessId ON businesses("businessId");
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);

-- 2. Tables Table
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

-- 3. Menu Items Table
CREATE TABLE IF NOT EXISTS "menuItems" (
  id BIGSERIAL PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  "imageUrl" TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  ingredients JSONB DEFAULT '[]'::jsonb,
  allergens JSONB DEFAULT '[]'::jsonb,
  "customizationOptions" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("businessId", name),
  FOREIGN KEY ("businessId") REFERENCES businesses("businessId") ON DELETE CASCADE
);

-- Indexes for menuItems
CREATE INDEX IF NOT EXISTS idx_menuItems_businessId ON "menuItems"("businessId");
CREATE INDEX IF NOT EXISTS idx_menuItems_category ON "menuItems"(category);

-- 4. Orders Table
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

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "menuItems" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Schema created successfully!
-- ============================================

