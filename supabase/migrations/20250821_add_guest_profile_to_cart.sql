-- Add guest profile data to cart_headers for spa bookings
-- This makes cart the source of truth for both bookings and profile data

ALTER TABLE public.cart_headers 
ADD COLUMN IF NOT EXISTS guest_profile JSONB,
ADD COLUMN IF NOT EXISTS venue_id TEXT,
ADD COLUMN IF NOT EXISTS booking_type TEXT; -- 'spa_visit', 'product_order', etc.

-- Add index for venue queries
CREATE INDEX IF NOT EXISTS idx_cart_headers_venue_id ON public.cart_headers(venue_id);
CREATE INDEX IF NOT EXISTS idx_cart_headers_booking_type ON public.cart_headers(booking_type);

-- Update RLS policies to handle venue-specific access
CREATE POLICY select_venue_cart_headers ON public.cart_headers 
FOR SELECT TO anon, authenticated 
USING (venue_id IS NULL OR venue_id = current_setting('app.current_venue_id', true));

COMMENT ON COLUMN public.cart_headers.guest_profile IS 'JSONB containing guest profile data: weight, gender, activity_level, diet_style, preferences, etc.';
COMMENT ON COLUMN public.cart_headers.venue_id IS 'Venue identifier for spa bookings (e.g., aoi_wellness_hub)';
COMMENT ON COLUMN public.cart_headers.booking_type IS 'Type of booking: spa_visit, product_order, experience_booking';
