import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('order_id');
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order_id parameter' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get order to find cart_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('cart_id')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get cart items with AI recommendations
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        item_id,
        qty,
        ai_recommendation,
        products (
          id,
          name,
          image_url,
          na_mg,
          k_mg,
          h2o_ml,
          mg_mg,
          protein_g,
          soluble_fiber_g,
          insoluble_fiber_g,
          b12_ug
        )
      `)
      .eq('cart_id', order.cart_id);
    
    if (cartError) {
      console.error('Error fetching cart items:', cartError);
      return NextResponse.json(
        { error: 'Failed to fetch drinks' },
        { status: 500 }
      );
    }
    
    // Map to drink format
    const drinks = (cartItems || []).map((item: any) => ({
      id: item.id,
      name: item.products?.name || 'Unknown',
      quantity: item.qty,
      reason: item.ai_recommendation?.reason || null,
      nutrients_provided: item.ai_recommendation?.nutrients_provided || {
        water: (item.products?.h2o_ml || 0) * item.qty,
        sodium: (item.products?.na_mg || 0) * item.qty,
        potassium: (item.products?.k_mg || 0) * item.qty,
        magnesium: (item.products?.mg_mg || 0) * item.qty,
        protein: (item.products?.protein_g || 0) * item.qty,
        fiber: ((item.products?.soluble_fiber_g || 0) + (item.products?.insoluble_fiber_g || 0)) * item.qty,
        b12: (item.products?.b12_ug || 0) * item.qty,
      },
      image_url: item.products?.image_url || null,
    }));
    
    return NextResponse.json({ drinks });
    
  } catch (error: any) {
    console.error('Error in get-drinks API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
