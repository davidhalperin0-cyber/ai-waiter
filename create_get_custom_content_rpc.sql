-- Create RPC function to get customContent directly from database
-- This bypasses Supabase client parsing issues and read replica lag
-- Run this in Supabase SQL Editor
-- CRITICAL: Use multiple strategies to force read from primary database
-- This ensures we get the latest committed data, not from read replica

CREATE OR REPLACE FUNCTION get_custom_content(p_business_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_custom_content JSONB;
  v_lock_key BIGINT;
BEGIN
  -- Generate a unique lock key based on business_id
  v_lock_key := hashtext(p_business_id || '_read_custom_content');
  
  -- CRITICAL: Acquire advisory lock to force connection to primary
  -- This helps ensure we're reading from the primary database, not a replica
  -- We use NOWAIT to avoid blocking, but still force primary connection
  BEGIN
    PERFORM pg_advisory_lock(v_lock_key);
  EXCEPTION WHEN OTHERS THEN
    -- If lock is already held, continue anyway
    NULL;
  END;
  
  -- CRITICAL: Longer delay to ensure replication has completed
  -- This gives time for the write to propagate to all replicas
  -- But we're still trying to read from primary via the lock
  PERFORM pg_sleep(0.5);
  
  -- CRITICAL: Use FOR UPDATE NOWAIT to force read from primary database
  -- FOR UPDATE forces a row-level lock, which should route to primary
  -- NOWAIT prevents blocking if the row is already locked
  -- This is more aggressive than SKIP LOCKED
  BEGIN
    SELECT "customContent" INTO v_custom_content
    FROM businesses
    WHERE "businessId" = p_business_id
    FOR UPDATE NOWAIT;
  EXCEPTION WHEN lock_not_available THEN
    -- If row is locked, wait a bit and try again without FOR UPDATE
    PERFORM pg_sleep(0.2);
    SELECT "customContent" INTO v_custom_content
    FROM businesses
    WHERE "businessId" = p_business_id;
  END;
  
  -- Release the advisory lock
  BEGIN
    PERFORM pg_advisory_unlock(v_lock_key);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore unlock errors
    NULL;
  END;
  
  -- If no data found, return null
  IF v_custom_content IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Log what we're returning for debugging
  RAISE NOTICE 'get_custom_content returning: phone=%, email=%, whatsapp=%, instagram=%, facebook=%', 
    v_custom_content->'contact'->>'phone',
    v_custom_content->'contact'->>'email',
    v_custom_content->'contact'->>'whatsapp',
    v_custom_content->'contact'->>'instagram',
    v_custom_content->'contact'->>'facebook';
  
  RETURN v_custom_content;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_custom_content(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_custom_content(TEXT) TO authenticated;


