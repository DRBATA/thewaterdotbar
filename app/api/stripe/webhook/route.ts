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
          // Check if customer has hydration assessment data stored in database
          let hydrationPlan = null;
          try {
            console.log('📧 Checking for hydration assessment data for session:', session_id);
            
            // Query for assessment data stored with this session_id
            const { data: assessmentData, error: assessmentError } = await supabase
              .from('hydration_assessments')
              .select('*')
              .eq('session_id', session_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (assessmentData && !assessmentError) {
              hydrationPlan = {
                profile: assessmentData.profile,
                dailyTargets: assessmentData.daily_targets,
                deficits: assessmentData.deficits,
                // TODO: Add AI recommendations from generate-meals API
                recommendedDrinks: assessmentData.recommended_drinks || [],
                recommendedMeals: assessmentData.recommended_meals || []
              };
              console.log('✅ Found hydration plan for enhanced email');
            } else {
              console.log('No hydration assessment found, sending basic receipt');
            }
          } catch (assessmentError) {
            console.log('Error fetching assessment:', assessmentError);
          }

          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'The Water Bar <hello@thewater.bar>',
            to: [orderData.email!],
            subject: hydrationPlan ? 
              `Your Personalized Hydration Plan + Order #${orderData.id.substring(0, 8)}` :
              `Your Water Bar Order Confirmation #${orderData.id.substring(0, 8)}`,
            react: OrderConfirmationEmail({
              orderId: orderData.id,
              userFirstName: session.customer_details?.name?.split(' ')[0] || 'Valued Customer',
              orderItems: orderData.order_items.map((item: { name: string; qty: number; pin_code: string; }) => ({ name: item.name, quantity: item.qty, pin_code: item.pin_code })),
              total: orderData.total,
              // TODO: Pass hydration plan data to enhanced email template
              hydrationPlan: hydrationPlan || undefined,
            }),
          });
          console.log(`${hydrationPlan ? 'Enhanced hydration plan' : 'Order confirmation'} email sent to ${orderData.email}`);
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
