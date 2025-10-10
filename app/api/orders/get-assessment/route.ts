import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json(
      { error: 'order_id is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Get order with cart_id
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('cart_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  // Get cart_header with assessment_data
  const { data: cartHeader, error: cartError } = await supabase
    .from('cart_headers')
    .select('assessment_data')
    .eq('id', order.cart_id)
    .single()

  if (cartError || !cartHeader) {
    return NextResponse.json(
      { error: 'Cart not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    assessmentData: cartHeader.assessment_data || null
  })
}
