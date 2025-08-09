-- Update migrate_cart_to_order function to include the plan JSONB field
-- This migration assumes the plan column already exists in both cart_items and order_items tables

CREATE OR REPLACE FUNCTION public.migrate_cart_to_order(
    p_session_id text,
    p_user_id uuid,
    p_stripe_session_id text,
    p_email text,
    p_utm_campaign text DEFAULT NULL
)
RETURNS uuid
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

    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'Cart not found for session_id: %', p_session_id;
    END IF;

    -- Calculate total from cart items
    SELECT COALESCE(SUM(
        COALESCE(p.price, e.price) * ci.qty
    ), 0)
    INTO v_total
    FROM public.cart_items ci
    LEFT JOIN public.products p ON ci.item_id = p.id
    LEFT JOIN public.experiences e ON ci.item_id = e.id
    WHERE ci.cart_id = v_cart_id;

    -- Create the order
    INSERT INTO public.orders (session_id, user_id, email, total, stripe_session_id, utm_campaign)
    VALUES (p_session_id, p_user_id, p_email, v_total, p_stripe_session_id, p_utm_campaign)
    RETURNING id INTO v_order_id;

    -- Copy NON-BUNDLE cart items into order_items, INCLUDING the plan field
    INSERT INTO public.order_items (order_id, item_id, qty, name, price, pin_code, claimed_at, plan)
    SELECT
        v_order_id,
        ci.item_id::uuid,
        ci.qty,
        COALESCE(p.name, e.name),
        COALESCE(p.price, e.price),
        LPAD((FLOOR(RANDOM() * 9000) + 1000)::text, 4, '0'),
        NULL,
        ci.plan -- Copy the plan JSONB field
    FROM public.cart_items ci
    LEFT JOIN public.products p ON ci.item_id = p.id
    LEFT JOIN public.experiences e ON ci.item_id = e.id
    WHERE ci.cart_id = v_cart_id AND ci.bundle_components IS NULL;

    -- Unpack BUNDLE items into separate order_items (bundles don't have plans)
    INSERT INTO public.order_items (order_id, item_id, qty, name, price, pin_code, claimed_at, plan)
    SELECT
        v_order_id,
        (component_id)::uuid AS item_id,
        1 AS qty,
        (component_id)::text AS name,
        0 AS price,
        LPAD((FLOOR(RANDOM() * 9000) + 1000)::text, 4, '0'),
        NULL,
        NULL -- Bundle components don't have individual plans
    FROM
        public.cart_items ci,
        jsonb_array_elements_text(ci.bundle_components) AS component_id
    WHERE
        ci.cart_id = v_cart_id AND ci.bundle_components IS NOT NULL;

    -- Clean up
    DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
    DELETE FROM public.cart_headers WHERE id = v_cart_id;

    RETURN v_order_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.migrate_cart_to_order(text, uuid, text, text, text) TO anon, authenticated, service_role;
