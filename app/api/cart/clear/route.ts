import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"
import { logEvent } from "@/lib/analytics"

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sessionId = getSessionId()

  // Delete all cart items for this user/session
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq(user ? "user_id" : "session_id", user ? user.id : sessionId)

  if (error) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the cart clear event for analytics
  logEvent({
    event_name: "cart_cleared",
    step_name: "cart",
    metadata: {
      user_id: user?.id || null,
      session_id: sessionId
    },
  })

  return NextResponse.json({ success: true })
}
