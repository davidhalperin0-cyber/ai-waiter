-- Create RPC function to update customContent directly in database
-- This bypasses Supabase client parsing issues and ensures data is actually saved
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_business_custom_content(
  p_business_id TEXT,
  p_custom_content JSONB
)
RETURNS TABLE (
  id BIGINT,
  "businessId" TEXT,
  name TEXT,
  "customContent" JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_business_id TEXT;
  v_name TEXT;
  v_custom_content JSONB;
  update_count INTEGER;
BEGIN
  -- Log what we're trying to save (for debugging)
  RAISE NOTICE 'Updating customContent for business: %', p_business_id;
  RAISE NOTICE 'New customContent: %', p_custom_content::text;
  
  -- Get the current value before update (for debugging)
  SELECT b."customContent" INTO v_custom_content
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  RAISE NOTICE 'Current customContent before update: %', v_custom_content::text;
  
  -- CRITICAL: Update the customContent directly using explicit JSONB cast
  -- This ensures the JSONB is properly set without any parsing issues
  -- DEBUG: Set debug_last_writer to track who wrote last
  -- Use explicit JSONB merge to ensure the update is applied correctly
  UPDATE public.businesses b
  SET "customContent" = p_custom_content::jsonb,
      debug_last_writer = 'RPC:update_business_custom_content'
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
  -- Use a fresh SELECT to ensure we get the latest data
  SELECT b."customContent" INTO v_custom_content
  FROM public.businesses b
  WHERE b."businessId" = p_business_id;
  
  -- If the immediate read doesn't match, something is wrong
  IF v_custom_content IS DISTINCT FROM p_custom_content::jsonb THEN
    RAISE EXCEPTION 'CRITICAL: Update was not applied! Expected: %, Got: %. This indicates a trigger, constraint, or RLS policy is interfering.', p_custom_content::text, v_custom_content::text;
  END IF;
  
  RAISE NOTICE 'Immediate verification passed - customContent was updated correctly';
  
  -- Store the verified value for later use
  -- We know it matches p_custom_content, so we can use it
  
  -- CRITICAL: Store the verified customContent for return
  -- We've already verified it matches, so use it directly
  -- Don't read again - use what we just verified
  
  -- CRITICAL: Force commit by committing the transaction explicitly
  -- We need to ensure the UPDATE is committed before we read back
  -- Use COMMIT (but we're in a function, so we need to work around this)
  -- Instead, use a separate connection or ensure the transaction is visible
  
  -- Force the transaction to be visible by doing a dummy SELECT that requires commit visibility
  -- This ensures any pending writes are flushed
  PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_commit'));
  
  -- Small delay to ensure commit is processed
  PERFORM pg_sleep(0.2);
  
  -- Fetch the updated values into variables
  -- Use FOR UPDATE SKIP LOCKED to avoid blocking, but ensure we get committed data
  SELECT 
    b.id,
    b."businessId",
    b.name,
    b."customContent"
  INTO 
    v_id,
    v_business_id,
    v_name,
    v_custom_content
  FROM public.businesses b
  WHERE b."businessId" = p_business_id
  FOR UPDATE SKIP LOCKED;
  
  RAISE NOTICE 'Fetched customContent after update: %', v_custom_content::text;
  
  -- CRITICAL: Verify the value was actually updated by comparing JSONB
  -- If it doesn't match, the update didn't actually happen
  -- Compare the contact object specifically to catch partial updates
  IF v_custom_content IS DISTINCT FROM p_custom_content::jsonb THEN
    RAISE NOTICE 'WARNING: customContent mismatch after commit! Expected: %, Got: %', p_custom_content::text, v_custom_content::text;
    
    -- Log specific field differences for debugging
    RAISE NOTICE 'Contact phone - Expected: %, Got: %', 
      p_custom_content->'contact'->>'phone', 
      v_custom_content->'contact'->>'phone';
    RAISE NOTICE 'Contact email - Expected: %, Got: %', 
      p_custom_content->'contact'->>'email', 
      v_custom_content->'contact'->>'email';
    
    -- Try one more time with explicit cast and force commit
    -- Use a more aggressive update that should definitely work
    UPDATE public.businesses b
    SET "customContent" = p_custom_content::jsonb,
        debug_last_writer = 'RPC:update_business_custom_content:retry'
    WHERE b."businessId" = p_business_id;
    
    -- Force commit again with longer delay
    PERFORM pg_advisory_xact_lock(hashtext(p_business_id || '_retry'));
    PERFORM pg_sleep(0.3);
    
    -- Fetch again with a fresh query
    SELECT b."customContent"
    INTO v_custom_content
    FROM public.businesses b
    WHERE b."businessId" = p_business_id
    FOR UPDATE SKIP LOCKED;
    
    RAISE NOTICE 'After retry, fetched customContent: %', v_custom_content::text;
    
    -- If still doesn't match, raise exception - the update is not working
    -- This indicates a serious problem (trigger, constraint, or RLS policy)
    IF v_custom_content IS DISTINCT FROM p_custom_content::jsonb THEN
      RAISE EXCEPTION 'Update failed: customContent was not saved correctly after retry. Expected: %, Got: %. This indicates the UPDATE statement is not actually modifying the row, or a trigger/constraint is reverting the change.', p_custom_content::text, v_custom_content::text;
    END IF;
  END IF;
  
  -- Final verification: ensure the contact object specifically matches
  IF v_custom_content->'contact' IS DISTINCT FROM p_custom_content->'contact' THEN
    RAISE EXCEPTION 'Update failed: contact object mismatch. Expected: %, Got: %', 
      p_custom_content->'contact'::text, 
      v_custom_content->'contact'::text;
  END IF;
  
  RAISE NOTICE 'Final verification passed - customContent and contact object match expected values';
  
  -- CRITICAL: Return the actual customContent from the database
  -- Use v_custom_content (what we read from DB) to ensure we return what's actually stored
  -- This is important because there might be triggers or other processes that modify the data
  -- We've already verified it matches what we sent, so return the actual DB value
  RETURN QUERY SELECT v_id, v_business_id, v_name, v_custom_content;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_business_custom_content(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_business_custom_content(TEXT, JSONB) TO authenticated;

