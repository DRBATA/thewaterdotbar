import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { itemId } = await req.json()
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sessionId = getSessionId()

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq(user ? "user_id" : "session_id", user?.id ?? sessionId)
    .eq("item_id", itemId)
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
