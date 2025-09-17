import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"

export async function POST(req: Request) {
  const { venue_id } = await req.json()
  console.log(`🛒 UPDATE-VENUE: Received request - venue_id=${venue_id}`)

  const supabase = await createClient()
  const sessionId = await getSessionId()
  console.log(`🛒 UPDATE-VENUE: Using session_id=${sessionId}`)

  try {
    // Find cart header for this session
    const { data: cartHeader, error: headerError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (headerError) {
      console.error(`🛒 UPDATE-VENUE: Cart header error:`, headerError)
      return NextResponse.json({ error: `Error finding cart: ${headerError.message}` }, { status: 400 })
    }

    if (!cartHeader) {
      console.log(`🛒 UPDATE-VENUE: No cart found for session ${sessionId}`)
      return NextResponse.json({ error: "No cart found" }, { status: 400 })
    }

    // Update cart header with venue_id
    const { error: updateError } = await supabase
      .from("cart_headers")
      .update({ venue_id })
      .eq("id", cartHeader.id)

    if (updateError) {
      console.error(`🛒 UPDATE-VENUE: Update error:`, updateError)
      return NextResponse.json({ error: `Failed to update venue: ${updateError.message}` }, { status: 400 })
    }

    console.log(`🛒 UPDATE-VENUE: Successfully updated cart ${cartHeader.id} with venue ${venue_id}`)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Cart update venue error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
