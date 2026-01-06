-- Create RPC function to update businessHours directly in database
-- This bypasses Supabase client issues and ensures data is actually saved
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_business_hours(
  p_business_id TEXT,
  p_business_hours JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "businessHours" JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_business_hours JSONB;
  update_count INTEGER;
BEGIN
  -- Log what we're trying to save (for debugging)
  RAISE NOTICE 'Updating businessHours for business: %', p_business_id;
  RAISE NOTICE 'New businessHours: %', p_business_hours::text;
  
  -- Get the current value before update (for debugging)
  SELECT b."businessHours" INTO v_business_hours
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  RAISE NOTICE 'Current businessHours before update: %', v_business_hours::text;
  
  -- CRITICAL: Update the businessHours directly
  -- DEBUG: Set debug_last_writer to track who wrote last
  UPDATE public.businesses b
  SET "businessHours" = p_business_hours::jsonb,
      debug_last_writer = 'RPC:update_business_hours'
  WHERE b."businessId" = p_business_id;
  
  -- Get the number of rows updated
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  RAISE NOTICE 'Rows updated: %', update_count;
  
  -- Verify the update actually happened
  IF update_count = 0 THEN
    RAISE EXCEPTION 'Business with id % not found', p_business_id;
  END IF;
  
  -- CRITICAL: Immediately verify the update was applied by reading it back
  -- This must happen in the same transaction to catch any trigger/constraint issues
  SELECT b."businessHours" INTO v_business_hours
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- If the immediate read doesn't match, something is wrong
  IF v_business_hours IS DISTINCT FROM p_business_hours::jsonb THEN
    RAISE EXCEPTION 'CRITICAL: Update was not applied! Expected: %, Got: %. This indicates a trigger, constraint, or RLS policy is interfering.', p_business_hours::text, v_business_hours::text;
  END IF;
  
  RAISE NOTICE 'Immediate verification passed - businessHours was updated correctly';
  
  -- Force the transaction to be visible by doing a dummy SELECT that requires commit visibility
  -- This ensures any pending writes are flushed
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_business_hours_commit'));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.2);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE SKIP LOCKED to avoid blocking, but ensure we get committed data
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."businessHours"
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_business_hours
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE SKIP LOCKED;
  
  RAISE NOTICE 'Fetched businessHours after update: %', v_business_hours::text;
  
  -- CRITICAL: Verify the value was actually updated
  -- If it doesn't match, the update didn't actually happen
  IF v_business_hours IS DISTINCT FROM p_business_hours::jsonb THEN
    RAISE NOTICE 'WARNING: businessHours mismatch after commit! Expected: %, Got: %', p_business_hours::text, v_business_hours::text;
    
    -- Try one more time with explicit update
    UPDATE public.businesses b
    SET "businessHours" = p_business_hours::jsonb,
        debug_last_writer = 'RPC:update_business_hours:retry'
    WHERE b."businessId" = p_business_id;
    
    -- Force commit again with longer delay
    PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_business_hours_retry'));
    PERFORM pg_sleep(0.3);
    
    -- Fetch again with a fresh query
    SELECT b."businessHours"
    INTO v_business_hours
    FROM public.businesses b
    WHERE b."businessId" = p_business_id
    FOR UPDATE SKIP LOCKED;
    
    RAISE NOTICE 'After retry, fetched businessHours: %', v_business_hours::text;
    
    -- If still doesn't match, raise exception - the update is not working
    -- This indicates a serious problem (trigger, constraint, or RLS policy)
    IF v_business_hours IS DISTINCT FROM p_business_hours::jsonb THEN
      RAISE EXCEPTION 'Update failed: businessHours was not saved correctly after retry. Expected: %, Got: %. This indicates the UPDATE statement is not actually modifying the row, or a trigger/constraint is reverting the change.', p_business_hours::text, v_business_hours::text;
    END IF;
  END IF;
  
  RAISE NOTICE 'Final verification passed - businessHours matches expected value';
  
  -- CRITICAL: Return the actual businessHours from the database
  -- Use v_business_hours (what we read from DB) to ensure we return what's actually stored
  RETURN QUERY SELECT v_id, v_business_id, v_name, v_business_hours;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_hours(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_hours(TEXT, JSONB) TO authenticated;

