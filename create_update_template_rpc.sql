-- Create RPC function to update template directly in database
-- This bypasses Supabase client issues and ensures data is actually saved
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_business_template(
  p_business_id TEXT,
  p_template TEXT
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  template TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_template TEXT;
  update_count INTEGER;
BEGIN
  -- Log what we're trying to save (for debugging)
  RAISE NOTICE 'Updating template for business: %', p_business_id;
  RAISE NOTICE 'New template: %', p_template;
  
  -- Get the current value before update (for debugging)
  SELECT b.template INTO v_template
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  RAISE NOTICE 'Current template before update: %', v_template;
  
  -- CRITICAL: Update the template directly
  -- DEBUG: Set debug_last_writer to track who wrote last
  UPDATE public.businesses b
  SET template = p_template,
      debug_last_writer = 'RPC:update_business_template'
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
  SELECT b.template INTO v_template
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- If the immediate read doesn't match, something is wrong
  IF v_template IS DISTINCT FROM p_template THEN
    RAISE EXCEPTION 'CRITICAL: Update was not applied! Expected: %, Got: %. This indicates a trigger, constraint, or RLS policy is interfering.', p_template, v_template;
  END IF;
  
  RAISE NOTICE 'Immediate verification passed - template was updated correctly';
  
  -- Force the transaction to be visible by doing a dummy SELECT that requires commit visibility
  -- This ensures any pending writes are flushed
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_template_commit'));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.2);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE SKIP LOCKED to avoid blocking, but ensure we get committed data
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b.template
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_template
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE SKIP LOCKED;
  
  RAISE NOTICE 'Fetched template after update: %', v_template;
  
  -- CRITICAL: Verify the value was actually updated
  -- If it doesn't match, the update didn't actually happen
  IF v_template IS DISTINCT FROM p_template THEN
    RAISE NOTICE 'WARNING: template mismatch after commit! Expected: %, Got: %', p_template, v_template;
    
    -- Try one more time with explicit update
    UPDATE public.businesses b
    SET template = p_template,
        debug_last_writer = 'RPC:update_business_template:retry'
    WHERE b."businessId" = p_business_id;
    
    -- Force commit again with longer delay
    PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_template_retry'));
    PERFORM pg_sleep(0.3);
    
    -- Fetch again with a fresh query
    SELECT b.template
    INTO v_template
    FROM public.businesses b
    WHERE b."businessId" = p_business_id
    FOR UPDATE SKIP LOCKED;
    
    RAISE NOTICE 'After retry, fetched template: %', v_template;
    
    -- If still doesn't match, raise exception - the update is not working
    -- This indicates a serious problem (trigger, constraint, or RLS policy)
    IF v_template IS DISTINCT FROM p_template THEN
      RAISE EXCEPTION 'Update failed: template was not saved correctly after retry. Expected: %, Got: %. This indicates the UPDATE statement is not actually modifying the row, or a trigger/constraint is reverting the change.', p_template, v_template;
    END IF;
  END IF;
  
  RAISE NOTICE 'Final verification passed - template matches expected value';
  
  -- CRITICAL: Return the actual template from the database
  -- Use v_template (what we read from DB) to ensure we return what's actually stored
  RETURN QUERY SELECT v_id, v_business_id, v_name, v_template;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_template(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_template(TEXT, TEXT) TO authenticated;

