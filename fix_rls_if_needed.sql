-- ============================================
-- Fix RLS if it's blocking updates
-- Run this ONLY if RLS is enabled and blocking updates
-- ============================================

-- First, check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'businesses';

-- If RLS is enabled and blocking updates, you have two options:

-- OPTION 1: Disable RLS (if you don't need it)
-- ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Create a policy that allows service role to update (RECOMMENDED)
-- This allows the service role (used by supabaseAdmin) to update businesses
CREATE POLICY IF NOT EXISTS "Service role can update businesses"
ON businesses
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Also allow service role to select
CREATE POLICY IF NOT EXISTS "Service role can select businesses"
ON businesses
FOR SELECT
TO service_role
USING (true);

