-- Create venue_experiences table following venue_stock pattern
-- Simple junction table: which experiences are available at which venues

CREATE TABLE venue_experiences (
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  
  -- Simple availability (like qty_on_hand in venue_stock)
  is_available BOOLEAN DEFAULT true,
  
  -- Capacity (like qty_on_hand but for bookings)
  max_capacity INTEGER DEFAULT 10,
  current_bookings INTEGER DEFAULT 0,
  
  -- Venue-specific price override (NULL = use base experience price)
  venue_price NUMERIC(10, 2),
  
  -- External booking link
  booking_url TEXT, -- Link to external booking system
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Primary key on the combination (like venue_stock)
  PRIMARY KEY (venue_id, experience_id)
);

-- Index for fast lookups
CREATE INDEX idx_venue_experiences_venue_id ON venue_experiences(venue_id);
CREATE INDEX idx_venue_experiences_experience_id ON venue_experiences(experience_id);

-- RLS policy
ALTER TABLE venue_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to venue_experiences" ON venue_experiences FOR SELECT USING (true);

-- Example usage:
-- 1. Get all experiences at venue: SELECT * FROM venue_experiences WHERE venue_id = $1 AND is_available = true;
-- 2. Check if experience available at venue: SELECT * FROM venue_experiences WHERE venue_id = $1 AND experience_id = $2;
-- 3. Get booking URL: SELECT booking_url FROM venue_experiences WHERE venue_id = $1 AND experience_id = $2;
