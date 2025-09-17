-- Make cart_items.venue_id nullable to allow adding products before selecting venue
-- This allows the natural flow: add products → select venue → checkout

ALTER TABLE public.cart_items 
ALTER COLUMN venue_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.cart_items.venue_id IS 'Venue ID - nullable to allow adding products before venue selection';
