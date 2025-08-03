
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch recent stock additions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stock_addition_history')
      .select('*')
      .order('added_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching stock additions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in stock additions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, venue_id, quantity_added, added_by, notes } = body

    // Validate required fields
    if (!product_id || !venue_id || !quantity_added || !added_by) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, venue_id, quantity_added, added_by' },
        { status: 400 }
      )
    }

    // Quantity can be positive (add) or negative (remove)
    // No validation on sign - UI handles this distinction
    // Just ensure it's not zero
    if (quantity_added === 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be zero' },
        { status: 400 }
      )
    }

    // Insert stock addition (trigger will automatically update venue_stock)
    const { data, error } = await supabase
      .from('stock_additions')
      .insert({
        product_id: product_id, // UUID string, no parseInt needed
        venue_id: venue_id,     // UUID string, no parseInt needed
        quantity_added: parseInt(quantity_added),
        added_by: added_by.trim(),
        notes: notes?.trim() || null
      })
      .select()

    if (error) {
      console.error('Error adding stock:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in stock additions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
