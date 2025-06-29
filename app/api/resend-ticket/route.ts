import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTicketEmail } from '@/lib/email';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, email, created_at')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('name, qty, pin_code')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    if (!order.email) {
      return NextResponse.json({ error: 'Order has no email address' }, { status: 400 });
    }

    const result = await sendTicketEmail(
      order.email,
      orderItems,
      order.id,
      order.created_at
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
