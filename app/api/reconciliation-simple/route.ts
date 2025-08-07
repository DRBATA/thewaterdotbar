import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Starting simple reconciliation...')
    
    // Get just stock movements first
    const { data: stockMovements, error: stockError } = await supabase
      .from('stock_addition_history')
      .select('*')
      .limit(10)

    if (stockError) {
      console.error('Stock error:', stockError)
      return NextResponse.json({ error: 'Stock error: ' + stockError.message }, { status: 500 })
    }

    console.log('Stock movements:', stockMovements?.length || 0)

    // Simple summary - just count totals
    const totalStockAdded = stockMovements?.reduce((sum, item) => {
      const qty = item.quantity_added || 0
      return sum + (qty > 0 ? qty : 0)
    }, 0) || 0

    const totalStockRemoved = stockMovements?.reduce((sum, item) => {
      const qty = item.quantity_added || 0
      return sum + (qty < 0 ? Math.abs(qty) : 0)
    }, 0) || 0

    // Create simple reconciliation records
    const reconciliation = []
    const productGroups = new Map()

    stockMovements?.forEach(movement => {
      const productName = movement.product_name || 'Unknown Product'
      const venueName = movement.venue_name || 'Unknown Venue'
      const key = `${productName}-${venueName}`
      
      if (!productGroups.has(key)) {
        productGroups.set(key, {
          product_name: productName,
          venue_name: venueName,
          stock_added: 0,
          stock_removed: 0,
          items_claimed: 0,
          current_stock: 0,
          calculated_stock: 0,
          variance: 0
        })
      }
      
      const record = productGroups.get(key)
      const qty = movement.quantity_added || 0
      if (qty > 0) {
        record.stock_added += qty
      } else {
        record.stock_removed += Math.abs(qty)
      }
    })

    const reconciliationResults = Array.from(productGroups.values())

    return NextResponse.json({
      status: 'success',
      summary: {
        total_products: reconciliationResults.length,
        items_with_variance: 0, // Will calculate later
        total_stock_added: totalStockAdded,
        total_stock_removed: totalStockRemoved,
        total_items_claimed: 0, // Will add later
        total_current_stock: 0 // Will add later
      },
      reconciliation: reconciliationResults,
      raw_data: {
        stock_movements_count: stockMovements?.length || 0,
        sample_movement: stockMovements?.[0] || null
      }
    })

  } catch (error) {
    console.error('Error in simple reconciliation:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
