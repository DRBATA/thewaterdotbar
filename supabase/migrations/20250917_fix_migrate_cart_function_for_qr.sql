-- Fix migrate_cart_to_order function for QR payment flow
-- This ensures the function matches webhook expectations and handles venue information

CREATE OR REPLACE FUNCTION public.migrate_cart_to_order(
  p_session_id TEXT,
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_email TEXT,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC;
  v_cart_id UUID;
  v_venue_id UUID;
BEGIN
  -- Find the cart header for this session
  SELECT id, venue_id INTO v_cart_id, v_venue_id
  FROM public.cart_headers
  WHERE session_id = p_session_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- No cart found - nothing to do
    RAISE NOTICE 'No cart found for session %', p_session_id;
    RETURN NULL;
  END IF;
    
  -- Calculate total from normalized cart structure
  SELECT SUM(COALESCE(p.price_aed, p.price, e.price) * ci.qty) INTO v_total
  FROM public.cart_items ci
  JOIN public.cart_headers ch ON ci.cart_id = ch.id
  LEFT JOIN products p ON ci.item_id = p.id
  LEFT JOIN experiences e ON ci.item_id = e.id
  WHERE ch.id = v_cart_id;
  
  -- Create the order with venue information
  INSERT INTO public.orders (
    session_id, 
    user_id, 
    email, 
    total, 
    stripe_session_id, 
    utm_campaign,
    venue_id
  )
  VALUES (
    p_session_id::UUID, 
    p_user_id, 
    p_email, 
    COALESCE(v_total, 0), 
    p_stripe_session_id, 
    p_utm_campaign,
    v_venue_id
  )
  RETURNING id INTO v_order_id;
  
  -- Copy cart items to order_items with PIN generation
  INSERT INTO public.order_items (order_id, item_id, qty, name, price, venue_id)
  SELECT 
    v_order_id, 
    ci.item_id, 
    ci.qty, 
    COALESCE(p.name, e.name), 
    COALESCE(p.price_aed, p.price, e.price),
    COALESCE(ci.venue_id, v_venue_id)
  FROM 
    public.cart_items ci
    JOIN public.cart_headers ch ON ci.cart_id = ch.id
    LEFT JOIN products p ON ci.item_id = p.id
    LEFT JOIN experiences e ON ci.item_id = e.id
  WHERE 
    ch.id = v_cart_id;
    
  -- Delete cart and cart items
  DELETE FROM public.cart_headers
  WHERE id = v_cart_id;
  -- Cart items will be deleted automatically via cascade
  
  -- Return the order_id for email confirmation
  RETURN v_order_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.migrate_cart_to_order(TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
