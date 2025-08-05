-- Supabase RPC Function: Get Most Recent Unclaimed Order for Email
-- This function finds the most recent order with unclaimed items for a given email

CREATE OR REPLACE FUNCTION get_most_recent_unclaimed_order(user_email TEXT)
RETURNS TABLE (
  order_id UUID,
  order_email TEXT,
  order_total DECIMAL,
  order_created_at TIMESTAMP,
  order_items JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.email as order_email,
    o.total as order_total,
    o.created_at as order_created_at,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', oi.id,
        'name', oi.name,
        'qty', oi.qty,
        'pin_code', oi.pin_code,
        'price', oi.price,
        'image_url', oi.image_url
      )
    ) as order_items
  FROM orders o
  INNER JOIN order_items oi ON o.id = oi.order_id
  WHERE o.email = user_email
    AND oi.claimed_at IS NULL  -- Only unclaimed items
  GROUP BY o.id, o.email, o.total, o.created_at
  ORDER BY o.created_at DESC  -- Most recent first
  LIMIT 1;  -- Only the most recent order
END;
$$;
