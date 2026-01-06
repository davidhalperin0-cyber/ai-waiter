-- ============================================
-- Check for triggers that might affect isEnabled
-- ============================================

-- 1. Check all triggers on businesses table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
ORDER BY trigger_name;

-- 2. Check for any functions that might be called by triggers
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_definition ILIKE '%isEnabled%'
    OR routine_definition ILIKE '%is_enabled%'
  )
ORDER BY routine_name;

-- 3. Check for any policies that might affect updates
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses';

-- 4. Check if there's a default value on isEnabled
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name = 'isEnabled';
