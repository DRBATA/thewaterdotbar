-- Migration to remove old cart table and simplify function
-- This runs AFTER the previous migration that created the normalized cart structure

-- Drop the old cart table since it's already been cleared
DROP TABLE IF EXISTS public.cart;

-- Simplify the migrate_cart_to_order function to only use the new structure
CREATE OR REPLACE FUNCTION public.migrate_cart_to_order(
  p_session_id TEXT,  -- Keep as text, not UUID
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_email TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC;
  v_cart_id UUID;
BEGIN
  -- Find the cart header for this session
  SELECT id INTO v_cart_id
  FROM public.cart_headers
  WHERE session_id = p_session_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- No cart found - nothing to do
    RAISE NOTICE 'No cart found for session %', p_session_id;
    RETURN;
  END IF;
    
  -- Calculate total from normalized cart structure
  SELECT SUM(COALESCE(p.price, e.price) * ci.qty) INTO v_total
  FROM public.cart_items ci
  JOIN public.cart_headers ch ON ci.cart_id = ch.id
  LEFT JOIN products p ON ci.item_id = p.id
  LEFT JOIN experiences e ON ci.item_id = e.id
  WHERE ch.id = v_cart_id;
  
  -- Create the order
  INSERT INTO public.orders (session_id, user_id, email, total, stripe_session_id)
  VALUES (p_session_id::UUID, p_user_id, p_email, COALESCE(v_total, 0), p_stripe_session_id)
  RETURNING id INTO v_order_id;
  
  -- Copy cart items to order_items
  INSERT INTO public.order_items (order_id, item_id, qty, name, price)
  SELECT 
    v_order_id, 
    ci.item_id, 
    ci.qty, 
    COALESCE(p.name, e.name), 
    COALESCE(p.price, e.price)
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
END;
$$;

-- Update permission for the modified function
GRANT execute ON FUNCTION public.migrate_cart_to_order(text, uuid, text, text) TO anon, authenticated, service_role;
