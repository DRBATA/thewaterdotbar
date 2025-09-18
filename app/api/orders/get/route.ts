import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  try {
    // Get the most recent order for this session
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        order_items (
          quantity,
          unit_price,
          products (
            name
          )
        )
      `)
      .eq("checkout_session_id", sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ items: [] })
    }

    // Format the response
    const items = order.order_items?.map((item: any) => ({
      name: item.products?.name || "Unknown Item",
      quantity: item.quantity,
      price: item.unit_price
    })) || []

    return NextResponse.json({ 
      items,
      total: order.total_amount,
      status: order.status
    })
  } catch (error: any) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
