import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return NextResponse.json({ 
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
      payment_status: session.payment_status,
      amount_total: session.amount_total
    })
  } catch (error: any) {
    console.error("Error checking payment status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
