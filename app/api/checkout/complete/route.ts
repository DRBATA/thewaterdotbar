import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Called after successful Stripe checkout to:
 * 1. Create order record
 * 2. Trigger receipt email with assessment data
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id, assessmentData } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Get Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const supabase = await createClient();
    const cartSessionId = session.metadata?.session_id;

    if (!cartSessionId) {
      return NextResponse.json({ error: 'Cart session not found' }, { status: 400 });
    }

    // Find cart header (with venue_id for stock tracking)
    const { data: cartHeader } = await supabase
      .from('cart_headers')
      .select('id, venue_id')
      .eq('session_id', cartSessionId)
      .single();

    if (!cartHeader) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Get cart items
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('item_id, qty')
      .eq('cart_id', cartHeader.id);

    // Get product details for each cart item
    const productIds = cartItems?.map(item => item.item_id) || [];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price_aed')
      .in('id', productIds);

    // Debug logging
    console.log('Cart items:', cartItems);
    console.log('Product IDs:', productIds);
    console.log('Products found:', products);
    console.log('Products error:', productsError);

    // Create order record (using products.price_aed)
    const orderItems = cartItems?.map((item: any) => {
      const product = products?.find(p => p.id === item.item_id);
      console.log(`Mapping item ${item.item_id}:`, product);
      return {
        item_id: item.item_id,
        name: product?.name || 'Unknown',
        qty: item.qty,
        price: product?.price_aed || 0,
      };
    }) || [];

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session_id,
        total,
        email: session.customer_details?.email,
        cart_id: cartHeader.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    await supabase.from('order_items').insert(
      orderItems.map(item => ({
        order_id: order.id,
        item_id: item.item_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      }))
    );

    // Clear cart items after successful order creation
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartHeader.id);

    // Decrement stock at the venue (if venue was selected)
    if (cartHeader.venue_id) {
      for (const item of orderItems) {
        await supabase.rpc('decrement_venue_stock', {
          p_product_id: item.item_id,
          p_venue_id: cartHeader.venue_id,
          p_quantity: item.qty
        });
      }
    }

    // Trigger email send with optional assessmentData from sessionStorage
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://thewater.bar'}/api/send-receipt-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        customerEmail: order.email,
        assessmentData, // Pass assessment data from client sessionStorage
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Failed to send receipt email:', emailResult);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      emailSent: emailResponse.ok,
    });

  } catch (error: any) {
    console.error('Error completing checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete checkout' },
      { status: 500 }
    );
  }
}
