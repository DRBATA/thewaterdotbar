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

  // For demo: assume a single Stripe Price ID stored in env VAR
  const priceId = process.env.STRIPE_TEST_PRICE_ID!

  const lineItems = cartRows.map((row) => ({
    price: priceId,
    quantity: row.qty,
  }))

  const checkout = await stripe.checkout.sessions.create({
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
