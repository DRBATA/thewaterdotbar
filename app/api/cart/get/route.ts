import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sessionId = getSessionId()

  // Fetch cart items for this user/session
  const { data: cartItems, error } = await supabase
    .from("cart")
    .select("*")
    .eq(user ? "user_id" : "session_id", user ? user.id : sessionId)

  if (error) {
    console.error("Error fetching cart items:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: cartItems || [] })
}
