import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Node runtime; Stripe SDK requires Node APIs
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature") as string;
  const rawBody = Buffer.from(buf);
  // Use ORDERS secret for this endpoint (charming-bigboy, adventurous-rhythm)
  const secret = process.env.STRIPE_WEBHOOK_SECRET_ORDERS!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { session_id, user_id, utm_campaign, venue_id } = session.metadata as Record<string, string>;

    function isUUID(str: string | undefined): str is string {
      return !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    }
    const safe_user_id = isUUID(user_id) ? user_id : null;

    const supabase = await createClient();

    const { data: order_id, error: rpcError } = await supabase.rpc("migrate_cart_to_order", {
      p_session_id: session_id,
      p_user_id: safe_user_id,
      p_stripe_session_id: session.id,
      p_email: session.customer_details?.email,
      p_utm_campaign: utm_campaign ?? null,
      p_venue_id: venue_id && venue_id !== "" ? venue_id : null, // Handle empty string as null
    });

    if (rpcError) {
      console.error("Supabase RPC Error:", JSON.stringify(rpcError, null, 2));
      return NextResponse.json({ error: "Error processing order.", details: rpcError }, { status: 500 });
    }

    if (order_id) {
      // Fetch the full order details for the email
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', order_id)
        .single();

      if (orderError || !orderData) {
        console.error('Error fetching order for email:', orderError);
        // Don't block the response for this, just log it
      } else {
        try {
          // Check if customer has hydration assessment data stored in cart_headers
          let assessmentData = null;
          try {
            console.log('📧 Checking for assessment data in cart_headers for session:', session_id);
            
            // Get cart_header with assessment_data
            const { data: cartHeader, error: cartError } = await supabase
              .from('cart_headers')
              .select('assessment_data')
              .eq('session_id', session_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (cartHeader?.assessment_data && !cartError) {
              assessmentData = cartHeader.assessment_data;
              console.log('✅ Found assessment data for enhanced email');
            } else {
              console.log('No assessment data found, sending basic receipt');
            }
          } catch (error) {
            console.log('Error fetching assessment:', error);
          }

          // Call the send-receipt-email API which handles everything properly
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://thewater.bar'}/api/send-receipt-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.id,
              customerEmail: orderData.email,
              assessmentData, // Pass assessment data if available
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResponse.ok) {
            console.log(`✅ ${assessmentData ? 'Enhanced email with assessment' : 'Basic receipt'} sent to ${orderData.email}`);
          } else {
            console.error('Failed to send receipt email:', emailResult);
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      // Log analytics event
      await supabase.from("analytics_events").insert([
        {
          event_type: "order_completed",
          session_id,
          utm_campaign: utm_campaign ?? "organic",
          order_id,
        },
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
