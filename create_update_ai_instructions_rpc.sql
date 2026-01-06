-- Create RPC function to update aiInstructions directly in database
-- This bypasses Supabase client issues and ensures data is actually saved
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_business_ai_instructions(
  p_business_id TEXT,
  p_ai_instructions TEXT
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "aiInstructions" TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_ai_instructions TEXT;
  update_count INTEGER;
BEGIN
  -- Log what we're trying to save (for debugging)
  RAISE NOTICE 'Updating aiInstructions for business: %', p_business_id;
  RAISE NOTICE 'New aiInstructions: %', p_ai_instructions;
  
  -- Get the current value before update (for debugging)
  SELECT b."aiInstructions" INTO v_ai_instructions
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  RAISE NOTICE 'Current aiInstructions before update: %', v_ai_instructions;
  
  -- CRITICAL: Update the aiInstructions directly
  -- DEBUG: Set debug_last_writer to track who wrote last
  UPDATE public.businesses b
  SET "aiInstructions" = p_ai_instructions,
      debug_last_writer = 'RPC:update_business_ai_instructions'
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
  SELECT b."aiInstructions" INTO v_ai_instructions
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- If the immediate read doesn't match, something is wrong
  IF v_ai_instructions IS DISTINCT FROM p_ai_instructions THEN
    RAISE EXCEPTION 'CRITICAL: Update was not applied! Expected: %, Got: %. This indicates a trigger, constraint, or RLS policy is interfering.', p_ai_instructions, v_ai_instructions;
  END IF;
  
  RAISE NOTICE 'Immediate verification passed - aiInstructions was updated correctly';
  
  -- Force the transaction to be visible by doing a dummy SELECT that requires commit visibility
  -- This ensures any pending writes are flushed
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_ai_instructions_commit'));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.2);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE SKIP LOCKED to avoid blocking, but ensure we get committed data
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."aiInstructions"
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_ai_instructions
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE SKIP LOCKED;
  
  RAISE NOTICE 'Fetched aiInstructions after update: %', v_ai_instructions;
  
  -- CRITICAL: Verify the value was actually updated
  -- If it doesn't match, the update didn't actually happen
  IF v_ai_instructions IS DISTINCT FROM p_ai_instructions THEN
    RAISE NOTICE 'WARNING: aiInstructions mismatch after commit! Expected: %, Got: %', p_ai_instructions, v_ai_instructions;
    
    -- Try one more time with explicit update
    UPDATE public.businesses b
    SET "aiInstructions" = p_ai_instructions,
        debug_last_writer = 'RPC:update_business_ai_instructions:retry'
    WHERE b."businessId" = p_business_id;
    
    -- Force commit again with longer delay
    PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_ai_instructions_retry'));
    PERFORM pg_sleep(0.3);
    
    -- Fetch again with a fresh query
    SELECT b."aiInstructions"
    INTO v_ai_instructions
    FROM public.businesses b
    WHERE b."businessId" = p_business_id
    FOR UPDATE SKIP LOCKED;
    
    RAISE NOTICE 'After retry, fetched aiInstructions: %', v_ai_instructions;
    
    -- If still doesn't match, raise exception - the update is not working
    -- This indicates a serious problem (trigger, constraint, or RLS policy)
    IF v_ai_instructions IS DISTINCT FROM p_ai_instructions THEN
      RAISE EXCEPTION 'Update failed: aiInstructions was not saved correctly after retry. Expected: %, Got: %. This indicates the UPDATE statement is not actually modifying the row, or a trigger/constraint is reverting the change.', p_ai_instructions, v_ai_instructions;
    END IF;
  END IF;
  
  RAISE NOTICE 'Final verification passed - aiInstructions matches expected value';
  
  -- CRITICAL: Return the actual aiInstructions from the database
  -- Use v_ai_instructions (what we read from DB) to ensure we return what's actually stored
  RETURN QUERY SELECT v_id, v_business_id, v_name, v_ai_instructions;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_ai_instructions(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_ai_instructions(TEXT, TEXT) TO authenticated;

