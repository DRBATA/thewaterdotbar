import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Check Stripe checkout session status
 * Used by Flow 2 (staff device polling) to detect payment completion
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if order exists in our database
    const supabase = await createClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, email')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    return NextResponse.json({
      payment_status: session.payment_status, // 'paid' or 'unpaid'
      status: session.status, // 'complete' or 'open'
      customer_email: session.customer_details?.email,
      order_id: order?.id || null,
    });

  } catch (error: any) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check session' },
      { status: 500 }
    );
  }
}
