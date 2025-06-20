import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies, headers } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sessionId = getSessionId()

  // fetch cart rows
  const { data: cartRows, error } = await supabase
    .from("cart")
    .select("item_id, qty")
    .eq(user ? "user_id" : "session_id", user ? user.id : sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!cartRows || cartRows.length === 0)
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 })

    // Initialise Stripe lazily so that missing env vars at build time don't crash.
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY env var missing" }, { status: 500 })
  }
  const stripe = new Stripe(stripeSecret)

    // Determine base URL with scheme (required by Stripe)
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!baseUrl) {
    const host = (await headers()).get("host")
    baseUrl = host ? `https://${host}` : undefined
  }
  if (!baseUrl?.startsWith("http")) {
    return NextResponse.json({ error: "BASE_URL missing or invalid" }, { status: 500 })
  }

  // Fetch all product and experience stripe_price_ids for lookup
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, stripe_price_id");
  if (productsError) {
    console.error("Supabase error fetching products for stripe_price_ids:", productsError);
    return NextResponse.json({ error: "Failed to fetch product pricing data" }, { status: 500 });
  }

  const { data: experiencesData, error: experiencesError } = await supabase
    .from("experiences")
    .select("id, stripe_price_id");
  if (experiencesError) {
    console.error("Supabase error fetching experiences for stripe_price_ids:", experiencesError);
    return NextResponse.json({ error: "Failed to fetch experience pricing data" }, { status: 500 });
  }

  const priceIdLookup: Record<string, string | null> = {};
  (productsData || []).forEach(p => { priceIdLookup[p.id] = p.stripe_price_id; });
  (experiencesData || []).forEach(e => { priceIdLookup[e.id] = e.stripe_price_id; });

  const lineItems = cartRows.map((row) => {
    const stripePriceId = priceIdLookup[row.item_id];
    if (!stripePriceId) {
      // This item from the cart doesn't have a corresponding stripe_price_id in products/experiences
      // Or it's missing from the products/experiences table entirely.
      // Throw an error or handle as appropriate. For now, we'll log and skip.
      console.error(`Item '${row.item_id}' in cart is missing a Stripe Price ID. Skipping.`);
      return null; // This item will be skipped
    }
    return {
      price: stripePriceId,
      quantity: row.qty,
    };
  }).filter(item => item !== null) as Stripe.Checkout.SessionCreateParams.LineItem[]; // Filter out nulls and assert type

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No items in cart have valid pricing information for checkout." }, { status: 400 });
  }

  const checkout = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    mode: "payment",
    line_items: lineItems,
    success_url: `${baseUrl}/success?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cart`,
    metadata: {
      session_id: sessionId,
      ...(user?.id && { user_id: user.id }),
    },
  })

  return NextResponse.json({ url: checkout.url })
}
