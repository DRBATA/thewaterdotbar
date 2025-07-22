CREATE OR REPLACE FUNCTION decrement_venue_stock(
    p_venue_id UUID,
    p_product_id UUID,
    p_amount INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.venue_stock
    SET qty_on_hand = qty_on_hand - p_amount
    WHERE venue_id = p_venue_id AND product_id = p_product_id AND qty_on_hand >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
