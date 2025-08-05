import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { WaterBarOrderConfirmationEmail } from '@/emails/water-bar-order-confirmation';

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

    // 2. Group unclaimed items by order_id
    const ordersToResend = unclaimedItems.reduce((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, typeof unclaimedItems>);

    // 3. For each order, fetch full details and resend the email
    for (const orderId in ordersToResend) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error(`Error fetching order ${orderId}:`, orderError);
        continue; // Skip to the next order
      }

      await resend.emails.send({
        from: 'The Water Bar <noreply@receipt.thewater.bar>',
        to: orderData.email,
        subject: `Your Water Bar Receipt (Order #${orderData.id})`,
        react: WaterBarOrderConfirmationEmail({
          order: orderData,
          userEmail: orderData.email
        }),
      });
    }

    return NextResponse.json({ message: 'Emails for unclaimed PINs have been resent.' });

  } catch (error) {
    console.error('Error resending unclaimed PINs:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
