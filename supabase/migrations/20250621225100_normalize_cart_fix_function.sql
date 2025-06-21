-- MIGRATION SCRIPT: Normalize Cart + Fix Function Type Issue
-- Create new normalized cart tables and fix migrate_cart_to_order function

-- First, create the new normalized cart tables
CREATE TABLE IF NOT EXISTS public.cart_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.cart_headers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (cart_id, item_id)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_cart_headers_session_id ON public.cart_headers(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_headers_user_id ON public.cart_headers(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_item_id ON public.cart_items(item_id);

-- Migrate data from old cart table to new structure
DO $$
DECLARE
  session_rec RECORD;
  cart_id UUID;
BEGIN
  -- For each unique session_id in the old cart table
  FOR session_rec IN SELECT DISTINCT session_id, user_id FROM public.cart
  LOOP
    -- Create a cart header
    INSERT INTO public.cart_headers (session_id, user_id)
    VALUES (session_rec.session_id, session_rec.user_id)
    RETURNING id INTO cart_id;
    
    -- Migrate items for this session
    INSERT INTO public.cart_items (cart_id, item_id, qty)
    SELECT cart_id, item_id, qty
    FROM public.cart
    WHERE session_id = session_rec.session_id
    AND (user_id = session_rec.user_id OR (user_id IS NULL AND session_rec.user_id IS NULL));
  END LOOP;
END $$;

-- Fix the migrate_cart_to_order function to handle text session_id
CREATE OR REPLACE FUNCTION public.migrate_cart_to_order(
  p_session_id TEXT,  -- Changed from UUID to text
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
    -- Also try the old cart method as fallback
    -- Calculate total from old cart structure
    SELECT SUM(price * qty) INTO v_total
    FROM (
      SELECT p.price, c.qty FROM cart c JOIN products p ON c.item_id = p.id WHERE c.session_id = p_session_id
      UNION ALL
      SELECT e.price, c.qty FROM cart c JOIN experiences e ON c.item_id = e.id WHERE c.session_id = p_session_id
    ) AS items;
    
    -- Create the order with stripe session ID
    INSERT INTO public.orders (session_id, user_id, email, total, stripe_session_id)
    VALUES (p_session_id::UUID, p_user_id, p_email, COALESCE(v_total, 0), p_stripe_session_id)
    RETURNING id INTO v_order_id;
    
    -- Copy old cart items to order_items  
    INSERT INTO public.order_items (order_id, item_id, qty, name, price)
    SELECT 
      v_order_id, 
      item_id, 
      qty, 
      COALESCE(p.name, e.name), 
      COALESCE(p.price, e.price)
    FROM 
      cart c
      LEFT JOIN products p ON c.item_id = p.id
      LEFT JOIN experiences e ON c.item_id = e.id
    WHERE 
      c.session_id = p_session_id;
      
    -- Delete from old cart
    DELETE FROM public.cart
    WHERE session_id = p_session_id;
    
    RETURN;
  END IF;
    
  -- Calculate total from normalized cart structure
  SELECT SUM(p.price * ci.qty) INTO v_total
  FROM public.cart_items ci
  JOIN public.cart_headers ch ON ci.cart_id = ch.id
  LEFT JOIN products p ON ci.item_id = p.id
  WHERE ch.id = v_cart_id;
  
  -- Add experiences prices
  SELECT COALESCE(v_total, 0) + COALESCE(SUM(e.price * ci.qty), 0) INTO v_total
  FROM public.cart_items ci
  JOIN public.cart_headers ch ON ci.cart_id = ch.id
  JOIN experiences e ON ci.item_id = e.id
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

-- Grant execute permission to the anonymous and authenticated roles
GRANT execute ON FUNCTION public.migrate_cart_to_order(text, uuid, text, text) TO anon, authenticated, service_role;

-- Apply appropriate permissions to new tables
ALTER TABLE public.cart_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Allow public insert to cart_headers
CREATE POLICY insert_cart_headers ON public.cart_headers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY select_own_cart_headers ON public.cart_headers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY update_own_cart_headers ON public.cart_headers FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY delete_own_cart_headers ON public.cart_headers FOR DELETE TO anon, authenticated USING (true);

-- Allow public insert to cart_items
CREATE POLICY insert_cart_items ON public.cart_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY select_own_cart_items ON public.cart_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY update_own_cart_items ON public.cart_items FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY delete_own_cart_items ON public.cart_items FOR DELETE TO anon, authenticated USING (true);

-- Note: We keep the old cart table for now as a backup
-- CREATE TABLE IF NOT EXISTS public.cart_old AS SELECT * FROM public.cart;
-- DROP TABLE IF EXISTS public.cart;
