import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { itemId, qty = 1 } = await req.json()
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Logged-in user (optional)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionId = getSessionId()

  const { error } = await supabase.from("cart").insert({
    user_id: user?.id ?? null,
    session_id: sessionId,
    item_id: itemId,
    qty,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
