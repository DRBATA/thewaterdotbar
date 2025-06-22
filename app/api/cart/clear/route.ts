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
      .maybeSingle()
    
    if (headerError) {
      throw new Error(`Error finding cart header: ${headerError.message}`)
    }
    
    // If cart header exists, delete it (will cascade delete cart_items)
    if (cartHeader) {
      const { error: deleteError } = await supabase
        .from("cart_headers")
        .delete()
        .eq("id", cartHeader.id)
      
      if (deleteError) {
        throw new Error(`Error deleting cart header: ${deleteError.message}`)
      }
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
