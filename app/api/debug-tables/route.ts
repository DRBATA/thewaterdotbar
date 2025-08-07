import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing table access...')

    // Test 1: Check if stock_addition_history table exists
    const { data: stockData, error: stockError } = await supabase
      .from('stock_addition_history')
      .select('*')
      .limit(1)

    console.log('Stock table test:', { stockData, stockError })

    // Test 2: Check if order_items table exists
    const { data: orderData, error: orderError } = await supabase
      .from('order_items')
      .select('product_id, venue_id, qty, claimed_at')
      .limit(1)

    console.log('Order items test:', { orderData, orderError })

    // Test 3: Check if venue_stock table exists
    const { data: venueStockData, error: venueStockError } = await supabase
      .from('venue_stock')
      .select('product_id, venue_id, qty_on_hand')
      .limit(1)

    console.log('Venue stock test:', { venueStockData, venueStockError })

    // Test 4: Check if products table exists
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)

    console.log('Products test:', { productsData, productsError })

    // Test 5: Check if venues table exists
    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('id, name')
      .limit(1)

    console.log('Venues test:', { venuesData, venuesError })

    return NextResponse.json({
      stock_addition_history: { data: stockData, error: stockError },
      order_items: { data: orderData, error: orderError },
      venue_stock: { data: venueStockData, error: venueStockError },
      products: { data: productsData, error: productsError },
      venues: { data: venuesData, error: venuesError }
    })

  } catch (error) {
    console.error('Error in debug tables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
