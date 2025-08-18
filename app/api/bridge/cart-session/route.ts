import { NextResponse } from "next/server"
import { getSessionId } from "@/lib/session"

export async function GET(request: Request) {
  try {
    // Get the browser's cart session ID (same one used by cart API)
    const sessionId = await getSessionId()
    
    console.log(`🔗 BRIDGE CART-SESSION: Returning session_id=${sessionId}`)
    
    return NextResponse.json({ 
      session_id: sessionId,
      success: true 
    })
  } catch (error: any) {
    console.error("Bridge cart-session error:", error)
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 })
  }
}
