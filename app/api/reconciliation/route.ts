import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get stock movements (additions and adjustments)
    const { data: stockMovements, error: stockError } = await supabase
      .from('stock_addition_history')
      .select('*')

    if (stockError) {
      console.error('Error fetching stock movements:', stockError)
      return NextResponse.json({ error: stockError.message }, { status: 500 })
    }

    // Get PIN claims (items that were claimed)
    const { data: claimedItems, error: claimsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        venue_id,
        qty,
        claimed_at,
        products(name),
        venues(name)
      `)
      .not('claimed_at', 'is', null) // Only claimed items

    if (claimsError) {
      console.error('Error fetching claimed items:', claimsError)
      return NextResponse.json({ error: claimsError.message }, { status: 500 })
    }

    // Get current stock levels
    const { data: currentStock, error: stockLevelError } = await supabase
      .from('venue_stock')
      .select(`
        product_id,
        venue_id,
        qty_on_hand,
        products(name),
        venues(name)
      `)

    if (stockLevelError) {
      console.error('Error fetching current stock:', stockLevelError)
      return NextResponse.json({ error: stockLevelError.message }, { status: 500 })
    }

    // Process reconciliation by product/venue
    const reconciliation = new Map()

    // Add stock movements
    stockMovements?.forEach(movement => {
      const key = `${movement.product_id}-${movement.venue_id}`
      if (!reconciliation.has(key)) {
        reconciliation.set(key, {
          product_id: movement.product_id,
          venue_id: movement.venue_id,
          product_name: movement.product_name,
          venue_name: movement.venue_name,
          stock_added: 0,
          stock_removed: 0,
          items_claimed: 0,
          current_stock: 0,
          calculated_stock: 0,
          variance: 0
        })
      }
      
      const record = reconciliation.get(key)
      if (movement.quantity_added > 0) {
        record.stock_added += movement.quantity_added
      } else {
        record.stock_removed += Math.abs(movement.quantity_added)
      }
    })

    // Add claimed items
    claimedItems?.forEach(claim => {
      const key = `${claim.product_id}-${claim.venue_id}`
      if (!reconciliation.has(key)) {
        reconciliation.set(key, {
          product_id: claim.product_id,
          venue_id: claim.venue_id,
          product_name: claim.products?.[0]?.name || 'Unknown',
          venue_name: claim.venue?.[0]?.name || 'Unknown',
          stock_added: 0,
          stock_removed: 0,
          items_claimed: 0,
          current_stock: 0,
          calculated_stock: 0,
          variance: 0
        })
      }
      
      const record = reconciliation.get(key)
      record.items_claimed += claim.qty
    })

    // Add current stock levels
    currentStock?.forEach(stock => {
      const key = `${stock.product_id}-${stock.venue_id}`
      if (reconciliation.has(key)) {
        const record = reconciliation.get(key)
        record.current_stock = stock.qty_on_hand
        record.product_name = stock.products?.[0]?.name || record.product_name
        record.venue_name = stock.venue?.[0]?.name || record.venue_name
      }
    })

    // Calculate expected stock and variance
    const results = Array.from(reconciliation.values()).map(record => {
      // Expected stock = Stock Added - Stock Removed - Items Claimed
      record.calculated_stock = record.stock_added - record.stock_removed - record.items_claimed
      
      // Variance = Current Stock - Expected Stock
      record.variance = record.current_stock - record.calculated_stock
      
      return record
    })

    // Sort by variance (largest discrepancies first)
    results.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))

    return NextResponse.json({
      summary: {
        total_products: results.length,
        items_with_variance: results.filter(r => r.variance !== 0).length,
        total_stock_added: results.reduce((sum, r) => sum + r.stock_added, 0),
        total_stock_removed: results.reduce((sum, r) => sum + r.stock_removed, 0),
        total_items_claimed: results.reduce((sum, r) => sum + r.items_claimed, 0),
        total_current_stock: results.reduce((sum, r) => sum + r.current_stock, 0)
      },
      reconciliation: results
    })

  } catch (error) {
    console.error('Error in reconciliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
