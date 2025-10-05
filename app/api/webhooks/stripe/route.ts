import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Stripe from 'stripe';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Node runtime; Stripe SDK requires Node APIs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generate signed URL for "Log to Tracker" action
 */
function generateSignedUrl(data: { products: any[]; userId?: string; orderId: string }): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'your-secret-key')
    .update(payload)
    .digest('base64url');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://thewater.bar';
  return `${baseUrl}/log-consumption?data=${payload}&sig=${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify Stripe webhook signature
    const buf = await request.arrayBuffer();
    const sig = request.headers.get("stripe-signature") as string;
    const rawBody = Buffer.from(buf);
    // Use HYDRATION secret for this endpoint (vibrant-inspiration)
    const secret = process.env.STRIPE_WEBHOOK_SECRET_HYDRATION!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
    
    console.log('💳 Stripe webhook received:', event.type);
    
    // Stripe webhook event types:
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    // - charge.refunded
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.booking_id;
      
      console.log(`✅ Payment succeeded for booking: ${bookingId}`);
      
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, customer_email, customer_name, pre_drinks, during_drinks, after_drinks')
        .eq('id', bookingId)
        .single();
      
      if (!booking) {
        console.error('❌ Booking not found:', bookingId);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      
      // Collect all drinks from booking
      const allDrinks = [
        ...(booking.pre_drinks || []),
        ...(booking.during_drinks || []),
        ...(booking.after_drinks || []),
      ];
      
      // Generate signed URL for "Log to Dexie" action
      const logUrl = generateSignedUrl({
        products: allDrinks,
        userId: booking.customer_email,
        orderId: paymentIntent.id,
      });
      
      // Send receipt email with action link
      await resend.emails.send({
        from: 'noreply@receipt.thewater.bar',
        to: booking.customer_email,
        subject: '🎉 Payment Confirmed - Your AOI Experience',
        html: `
          <h1>Payment Confirmed!</h1>
          <p>Hi ${booking.customer_name},</p>
          <p>Your payment of AED ${(paymentIntent.amount / 100).toFixed(2)} has been confirmed.</p>
          
          <h2>Your Paired Drinks:</h2>
          <ul>
            ${allDrinks.map(d => `<li>${d.name} - ${d.quantity}x</li>`).join('')}
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${logUrl}" 
               style="display: inline-block; background: #6F3BD2; color: white; padding: 16px 32px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600;">
              📊 Log to Your Hydration Tracker
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Track your consumption to get personalized hydration insights!
          </p>
        `,
      });
      
      console.log(`✅ Receipt sent with tracking link to: ${booking.customer_email}`);
      
      // Update booking status
      await supabase
        .from('bookings')
        .update({ booking_status: 'paid', payment_id: paymentIntent.id })
        .eq('id', bookingId);
    }
    
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      
      // TODO: Send failure notification email
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
