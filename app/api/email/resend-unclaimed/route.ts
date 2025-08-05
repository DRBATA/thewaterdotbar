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
    // Use Supabase RPC function to get the most recent unclaimed order
    const { data: orderResult, error: rpcError } = await supabase
      .rpc('get_most_recent_unclaimed_order', { user_email: email });

    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError);
      throw rpcError;
    }

    if (!orderResult || orderResult.length === 0) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ message: 'If any unclaimed PINs exist, they have been resent.' });
    }

    // Get the order data from RPC result
    const orderData = orderResult[0];
    
    // Parse the JSON order_items (it comes as JSON from the RPC function)
    const orderItems = Array.isArray(orderData.order_items) 
      ? orderData.order_items 
      : JSON.parse(orderData.order_items || '[]');

    // For now, just add (Most Recent) if we suspect multiple orders
    // (We can simplify this since the RPC already gets the most recent)
    const subjectSuffix = ' (Most Recent)';
    
    // Use the EXACT same email logic as the working stripe webhook
    await resend.emails.send({
      from: 'The Water Bar <hello@thewater.bar>',
      to: [orderData.order_email],
      subject: `Your Water Bar Order Confirmation #${orderData.order_id.toString().substring(0, 8)}${subjectSuffix}`,
      react: OrderConfirmationEmail({
        orderId: orderData.order_id,
        userFirstName: 'Valued Customer',
        orderItems: orderItems.map((item: { name: string; qty: number; pin_code: string; }) => ({ 
          name: item.name, 
          quantity: item.qty, 
          pin_code: item.pin_code 
        })),
        total: orderData.order_total,
      }),
    });

    return NextResponse.json({ message: 'Emails for unclaimed PINs have been resent.' });

  } catch (error) {
    console.error('Error resending unclaimed PINs:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
