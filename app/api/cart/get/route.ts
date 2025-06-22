import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"

export async function GET() {
  const supabase = await createClient()
  
  const sessionId = await getSessionId()

  try {
    // Find cart header for this session
    const { data: cartHeader, error: headerError } = await supabase
      .from("cart_headers")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle()
    
    if (headerError) {
      throw new Error(`Error fetching cart header: ${headerError.message}`)
    }

    if (!cartHeader) {
      // No cart exists yet for this session
      return NextResponse.json({ items: [] })
    }

    // Fetch items from cart_items
    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select("item_id, qty")
      .eq("cart_id", cartHeader.id)

    if (itemsError) {
      console.error("Error fetching cart items:", itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ items: cartItems || [] })
  } catch (error: any) {
    console.error("Cart fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
