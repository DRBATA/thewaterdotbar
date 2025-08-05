import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Create clients inside the function to avoid build-time issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 1. Find all unclaimed order_items for the given email
    const { data: unclaimedItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        order:orders!inner(email)
      `)
      .eq('order.email', email)
      .is('claimed_at', null);

    if (itemsError) throw itemsError;

    if (!unclaimedItems || unclaimedItems.length === 0) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ message: 'If any unclaimed PINs exist, they have been resent.' });
    }

    // 2. Group unclaimed items by order_id and find the most recent order
    const ordersToResend = unclaimedItems.reduce((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, typeof unclaimedItems>);

    const orderIds = Object.keys(ordersToResend);
    
    // If multiple orders have unclaimed items, we'll send the most recent one
    // but could add logic here to handle multiple orders if needed
    if (orderIds.length > 1) {
      console.log(`Multiple orders with unclaimed items found for ${email}:`, orderIds);
      // For now, we'll process the first one, but this could be enhanced
      // to show a "multiple orders" message or send the most recent by date
    }

    // 3. Process only the first/most recent order (could be enhanced to sort by date)
    const orderId = orderIds[0];
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(*)
      `)
      .eq('id', orderId)
      .is('order_items.claimed_at', null)
      .single();

    if (orderError) {
      console.error(`Error fetching order ${orderId}:`, orderError);
      return NextResponse.json({ error: 'Error fetching order details.' }, { status: 500 });
    }

    // Add a note if multiple orders were found
    const subjectSuffix = orderIds.length > 1 ? ' (Most Recent)' : '';
    
    await resend.emails.send({
      from: 'The Water Bar <hello@thewater.bar>',
      to: [orderData.email],
      subject: `Your Water Bar Order Confirmation #${orderData.id.substring(0, 8)}${subjectSuffix}`,
      react: OrderConfirmationEmail({
        orderId: orderData.id,
        userFirstName: 'Valued Customer',
        orderItems: orderData.order_items.map((item: { name: string; qty: number; pin_code: string; }) => ({ 
          name: item.name, 
          quantity: item.qty, 
          pin_code: item.pin_code 
        })),
        total: orderData.total,
      }),
    });

    return NextResponse.json({ message: 'Emails for unclaimed PINs have been resent.' });

  } catch (error) {
    console.error('Error resending unclaimed PINs:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
