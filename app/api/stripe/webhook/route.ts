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
    const { session_id, user_id } = session.metadata as Record<string, string>;

    const supabase = createClient(cookies());

    // move cart rows into orders table then clear cart (simple SQL in-call)
    const { error } = await supabase.rpc("migrate_cart_to_order", {
      p_session_id: session_id,
      p_user_id: user_id ?? null,
      p_stripe_session_id: session.id,
      p_email: session.customer_details?.email,
    });

    if (error) {
      console.error("Supabase RPC Error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Error processing order.", details: error },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
