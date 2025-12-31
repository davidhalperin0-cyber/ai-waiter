-- ============================================
-- Create RPC function to execute raw SQL
-- ============================================
-- This allows us to bypass Supabase client and use direct SQL

CREATE OR REPLACE FUNCTION exec_sql(
  sql_query TEXT,
  sql_params JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  result JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Execute the SQL query with parameters
  -- Note: This is a simplified version - in production you'd want more validation
  EXECUTE sql_query INTO v_result USING sql_params;
  
  RETURN QUERY SELECT v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO authenticated;

