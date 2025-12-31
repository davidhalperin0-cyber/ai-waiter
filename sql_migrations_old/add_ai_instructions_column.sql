-- Add ai_instructions column to businesses table
-- This allows businesses to provide custom instructions for the AI assistant

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS "aiInstructions" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN businesses."aiInstructions" IS 'Custom instructions for AI assistant (e.g., "Sushi items X, Y must be cooked, not raw")';

-- Note: Supabase uses camelCase for column names when quoted, so "aiInstructions" is correct

