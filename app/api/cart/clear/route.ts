import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSessionId } from "@/lib/session"
import { logEvent } from "@/lib/analytics"

export async function POST() {
  const supabase = await createClient()
  
  const sessionId = await getSessionId()

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
      throw new Error(`Error finding cart header: ${headerError.message}`)
    }
    
    // If cart header exists, delete only the items, keep the header
    if (cartHeader) {
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartHeader.id)
      
      if (deleteError) {
        throw new Error(`Error deleting cart items: ${deleteError.message}`)
      }
      console.log(`🛒 CLEAR: Cleared items from cart ${cartHeader.id}, keeping header`)
    }
    
    // Log the cart clear event for analytics
    logEvent({
      event_name: "cart_cleared",
      step_name: "cart",
      metadata: {

        session_id: sessionId
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
