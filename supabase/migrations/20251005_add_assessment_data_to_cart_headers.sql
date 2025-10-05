-- Add assessment_data column to cart_headers for storing AI-generated hydration plan outputs
-- This stores ONLY AI outputs (recommended drinks with reasons, recommended meals with images)
-- NOT the full user context (which stays client-side in sessionStorage/Dexie)

ALTER TABLE public.cart_headers 
ADD COLUMN IF NOT EXISTS assessment_data JSONB;

-- Add index for querying carts with assessment data
CREATE INDEX IF NOT EXISTS idx_cart_headers_assessment_data 
ON public.cart_headers 
USING GIN (assessment_data);

COMMENT ON COLUMN public.cart_headers.assessment_data IS 
'JSONB containing AI-generated hydration plan outputs: 
{
  "recommended_drinks": [{"name": "...", "reason": "...", "quantity": 1, ...}],
  "recommended_meals": [{"name": "...", "description": "...", "imageUrl": "...", ...}]
}
This is what staff see when scanning QR codes. Full assessment context (deficits, etc.) is client-side only.';
