-- Create table for tracking QR/NFC scans
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses("businessId") ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_type TEXT, -- 'mobile', 'desktop', 'tablet', etc.
  user_agent TEXT,
  referer TEXT,
  source TEXT -- 'qr', 'nfc', 'direct_link', etc.
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_scans_business_id ON qr_scans(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_business_table ON qr_scans(business_id, table_id);

-- Enable RLS (Row Level Security)
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to insert and read
CREATE POLICY "Service role can manage qr_scans" ON qr_scans
  FOR ALL
  USING (true)
  WITH CHECK (true);

