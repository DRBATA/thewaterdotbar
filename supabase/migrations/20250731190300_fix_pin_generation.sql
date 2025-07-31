-- Fix migrate_cart_to_order function to properly generate PINs
-- This ensures PINs are generated for each order item during cart migration

create or replace function public.migrate_cart_to_order(
  p_session_id uuid,
  p_user_id uuid,
  p_stripe_session_id text,
  p_email text,
  p_utm_campaign text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_total numeric;
begin
  -- 1. Calculate total from cart (products only, no experiences table anymore)
  select sum(p.price * c.qty) into v_total
  from cart c 
  join products p on c.item_id = p.id 
  where c.session_id::uuid = p_session_id;

  -- 2. Create the order
  insert into public.orders (session_id, user_id, email, total, stripe_session_id, utm_campaign)
  values (p_session_id, p_user_id, p_email, v_total, p_stripe_session_id, p_utm_campaign)
  returning id into v_order_id;

  -- 3. Copy cart items to order_items WITH PIN generation
  -- The pin_code column has a default random generator, so we don't need to specify it
  insert into public.order_items (order_id, item_id, qty, name, price)
  select v_order_id, c.item_id, c.qty, p.name, p.price
  from cart c 
  join products p on c.item_id = p.id 
  where c.session_id::uuid = p_session_id;

  -- 4. Clear the cart for this session
  delete from public.cart
  where cart.session_id::uuid = p_session_id;

  -- 5. Return the order_id for confirmation emails
  return v_order_id;

end;
$$;

-- Grant execute permission to the necessary roles
grant execute on function public.migrate_cart_to_order(uuid, uuid, text, text, text) to anon, authenticated, service_role;
