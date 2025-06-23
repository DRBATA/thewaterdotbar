import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { session_id, user_id, utm_campaign } = session.metadata as Record<string, string>;

    // Validate user_id is a UUID or set to null
    function isUUID(str: string | undefined): str is string {
      return !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    }
    const safe_user_id = isUUID(user_id) ? user_id : null;

    const supabase = await createClient();

    // move cart rows into orders table then clear cart (simple SQL in-call)
    const { data: order_id, error } = await supabase.rpc("migrate_cart_to_order", {
      p_session_id: session_id,
      p_user_id: safe_user_id,
      p_stripe_session_id: session.id,
      p_email: session.customer_details?.email,
      p_utm_campaign: utm_campaign ?? null,
    });

    if (error) {
      console.error("Supabase RPC Error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Error processing order.", details: error },
        { status: 500 }
      );
    }

    // Log the analytics event ONLY if order_id is present and no error
    if (order_id) {
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
