-- Create table for tracking chat interactions
CREATE TABLE IF NOT EXISTS chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses("businessId") ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  entered_chat_at TIMESTAMP WITH TIME ZONE,
  placed_order_at TIMESTAMP WITH TIME ZONE,
  order_id TEXT, -- Reference to order if one was placed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_interactions_business_id ON chat_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_table_id ON chat_interactions(table_id);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_entered_chat_at ON chat_interactions(entered_chat_at);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_placed_order_at ON chat_interactions(placed_order_at);
CREATE INDEX IF NOT EXISTS idx_chat_interactions_business_table ON chat_interactions(business_id, table_id);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to insert and read
CREATE POLICY "Service role can manage chat_interactions" ON chat_interactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

