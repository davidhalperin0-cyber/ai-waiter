-- Add posConfig column to businesses table
-- This allows each business to configure their own POS API integration

DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'businesses' AND column_name = 'posConfig'
    ) THEN
        -- Add posConfig column
        ALTER TABLE businesses
        ADD COLUMN "posConfig" JSONB DEFAULT '{"enabled": false, "endpoint": "", "method": "POST", "headers": {}, "timeoutMs": 5000}'::jsonb;
        
        RAISE NOTICE 'posConfig column added successfully';
    ELSE
        RAISE NOTICE 'posConfig column already exists';
    END IF;
END $$;





