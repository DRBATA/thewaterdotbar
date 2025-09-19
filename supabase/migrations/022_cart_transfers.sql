-- Cart transfer system for AOI integration
CREATE TABLE cart_transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  cart_items jsonb NOT NULL,
  assessment_data jsonb,
  venue_target text NOT NULL DEFAULT 'AOI',
  status text NOT NULL DEFAULT 'pending', -- pending, scanned, completed, expired
  transfer_code text UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamp with time zone,
  booking_id uuid,
  redistribution_log jsonb -- AI decisions on drink placement
);

-- Index for quick lookups
CREATE INDEX idx_cart_transfers_status ON cart_transfers(status);
CREATE INDEX idx_cart_transfers_session ON cart_transfers(session_id);
CREATE INDEX idx_cart_transfers_expires ON cart_transfers(expires_at);

-- Booking drinks table for AOI
CREATE TABLE booking_drinks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  pathway_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES hydration_options(id),
  quantity integer NOT NULL DEFAULT 1,
  timing text CHECK (timing IN ('before', 'during', 'after')),
  rationale text, -- AI reasoning for placement
  added_via text DEFAULT 'manual', -- manual, transfer, ai_suggestion
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(booking_id, pathway_id, product_id, timing)
);

-- Clean up expired transfers
CREATE OR REPLACE FUNCTION cleanup_expired_transfers()
RETURNS void AS $$
BEGIN
  UPDATE cart_transfers 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Run cleanup every 5 minutes
SELECT cron.schedule('cleanup-cart-transfers', '*/5 * * * *', 'SELECT cleanup_expired_transfers();');
