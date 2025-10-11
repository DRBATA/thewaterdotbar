import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/orders/[orderId]
 * 
 * Fetch order details including assessment_data
 * Used for F45 scenario: Download assessment from email link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch order with assessment data
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_email,
        customer_name,
        order_date,
        total_amount,
        assessment_data,
        order_items (
          id,
          name,
          qty,
          price
        )
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.error('Order not found:', error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
