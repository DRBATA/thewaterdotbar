import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing minimal reconciliation...')

    // Test each table individually with minimal data
    const { data: stockData, error: stockError } = await supabase
      .from('stock_addition_history')
      .select('id, product_id, venue_id, quantity_added, added_by, added_at')
      .limit(5)

    if (stockError) {
      console.error('Stock error:', stockError)
      return NextResponse.json({ error: 'Stock error: ' + stockError.message }, { status: 500 })
    }

    const { data: claimsData, error: claimsError } = await supabase
      .from('order_items')
      .select('id, product_id, venue_id, qty, claimed_at')
      .not('claimed_at', 'is', null)
      .limit(5)

    if (claimsError) {
      console.error('Claims error:', claimsError)
      return NextResponse.json({ error: 'Claims error: ' + claimsError.message }, { status: 500 })
    }

    const { data: stockLevels, error: stockLevelsError } = await supabase
      .from('venue_stock')
      .select('id, product_id, venue_id, qty_on_hand')
      .limit(5)

    if (stockLevelsError) {
      console.error('Stock levels error:', stockLevelsError)
      return NextResponse.json({ error: 'Stock levels error: ' + stockLevelsError.message }, { status: 500 })
    }

    // Simple reconciliation calculation
    const summary = {
      stock_movements: stockData?.length || 0,
      claimed_items: claimsData?.length || 0,
      current_stock_entries: stockLevels?.length || 0,
      sample_stock_movement: stockData?.[0] || null,
      sample_claim: claimsData?.[0] || null,
      sample_stock_level: stockLevels?.[0] || null
    }

    return NextResponse.json({
      status: 'success',
      message: 'Basic reconciliation test passed',
      summary
    })

  } catch (error) {
    console.error('Error in recon test:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
