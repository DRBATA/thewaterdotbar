-- This script fixes the type mismatch error in the migrate_cart_to_order function.
-- It explicitly casts the cart.session_id from text to uuid for comparison.

create or replace function public.migrate_cart_to_order(
  p_session_id uuid,
  p_user_id uuid,
  p_stripe_session_id text,
  p_email text
)
returns void
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_total numeric;
begin
  -- 1. Calculate total from cart. We must join products/experiences to get prices.
  -- This assumes cart items can be from either products or experiences tables.
  -- A more robust solution might use a view to union products and experiences.
  select sum(price * qty) into v_total
  from (
    select p.price, c.qty from cart c join products p on c.item_id = p.id where c.session_id::uuid = p_session_id
    union all
    select e.price, c.qty from cart c join experiences e on c.item_id = e.id where c.session_id::uuid = p_session_id
  ) as items;

  -- 2. Create the order
  insert into public.orders (session_id, user_id, email, total, stripe_session_id)
  values (p_session_id, p_user_id, p_email, v_total, p_stripe_session_id)
  returning id into v_order_id;

  -- 3. Copy cart items to order_items
  insert into public.order_items (order_id, item_id, qty, name, price)
  select v_order_id, item_id, qty, name, price
  from (
    select c.item_id, c.qty, p.name, p.price from cart c join products p on c.item_id = p.id where c.session_id::uuid = p_session_id
    union all
    select c.item_id, c.qty, e.name, e.price from cart c join experiences e on c.item_id = e.id where c.session_id::uuid = p_session_id
  ) as items;

  -- 4. Clear the cart for this session
  delete from public.cart
  where cart.session_id::uuid = p_session_id;

end;
$$;

-- Grant execute permission to the anonymous and authenticated roles
grant execute on function public.migrate_cart_to_order(uuid, uuid, text, text) to anon, authenticated, service_role;
