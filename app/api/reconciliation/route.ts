import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Starting simple reconciliation API...')
    
    // Only include stock movements from July 28th onward (when proper stock management started)
    const cutoffDate = '2024-07-28T00:00:00.000Z'
    
    const { data: stockMovements, error: stockError } = await supabase
      .from('stock_addition_history')
      .select('*')
      .limit(100)

    if (stockError) {
      console.error('Error fetching stock movements:', stockError)
      return NextResponse.json({ error: 'Stock error: ' + stockError.message }, { status: 500 })
    }

    // Only include claimed items for physical products (exclude drinks/mocktails)
    // For now, let's simplify and just get basic claimed items data
    const { data: claimedItems, error: claimsError } = await supabase
      .from('order_items')
      .select('item_id, venue_id, qty, claimed_at, name')
      .not('claimed_at', 'is', null)
      .limit(100)

    if (claimsError) {
      console.error('Error fetching claimed items:', claimsError)
      return NextResponse.json({ error: 'Claims error: ' + claimsError.message }, { status: 500 })
    }

    const { data: currentStock, error: stockLevelError } = await supabase
      .from('venue_stock')
      .select(`
        product_id, 
        venue_id, 
        qty_on_hand,
        products!inner(name, category),
        venue(name)
      `)
      .neq('products.category', 'drink')
      .limit(100)

    if (stockLevelError) {
      console.error('Error fetching current stock:', stockLevelError)
      return NextResponse.json({ error: 'Stock levels error: ' + stockLevelError.message }, { status: 500 })
    }

    // DEBUG: Log what we found in venue_stock
    console.log('=== VENUE STOCK DEBUG ===')
    console.log('Current stock records found:', currentStock?.length || 0)
    currentStock?.forEach(stock => {
      // Supabase returns relationships as arrays, so we need to access the first element
      const product = Array.isArray(stock.products) ? stock.products[0] : stock.products
      const venue = Array.isArray(stock.venue) ? stock.venue[0] : stock.venue
      
      const productName = product?.name || 'Unknown'
      const venueName = venue?.name || 'Unknown'
      const category = product?.category || 'Unknown'
      console.log(`Stock: ${productName} (${category}) at ${venueName} = ${stock.qty_on_hand} (product_id: ${stock.product_id}, venue_id: ${stock.venue_id})`)
    })

    // Calculate simple totals
    const totalStockAdded = stockMovements?.reduce((sum, item) => {
      const qty = item.quantity_added || 0
      return sum + (qty > 0 ? qty : 0)
    }, 0) || 0

    const totalStockRemoved = stockMovements?.reduce((sum, item) => {
      const qty = item.quantity_added || 0
      return sum + (qty < 0 ? Math.abs(qty) : 0)
    }, 0) || 0

    const totalItemsClaimed = claimedItems?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0
    const totalCurrentStock = currentStock?.reduce((sum, item) => sum + (item.qty_on_hand || 0), 0) || 0

    // Create reconciliation map - group by product/venue for stock movements
    const reconciliationMap = new Map()

    // Process stock movements (these are always products with product_id)
    stockMovements?.forEach(movement => {
      const productName = movement.product_name || 'Unknown Product'
      const venueName = movement.venue_name || 'Unknown Venue'
      const key = `${productName}-${venueName}`
      
      if (!reconciliationMap.has(key)) {
        reconciliationMap.set(key, {
          product_id: movement.product_id, // Store for venue_stock matching
          venue_id: movement.venue_id,     // Store for venue_stock matching
          product_name: productName,
          venue_name: venueName,
          stock_added: 0,
          stock_removed: 0,
          items_claimed: 0,
          current_stock: 0,
          calculated_stock: 0,
          variance: 0,
          type: 'product' // This is a physical product with stock
        })
      }
      
      const record = reconciliationMap.get(key)
      const qty = movement.quantity_added || 0
      if (qty > 0) {
        record.stock_added += qty
      } else {
        record.stock_removed += Math.abs(qty)
      }
    })

    // Process claimed items (these can be products OR experiences)
    // For now, we'll create separate tracking for experiences vs products
    const experienceClaimsMap = new Map()
    
    claimedItems?.forEach(claim => {
      const itemName = claim.name || 'Unknown Item'
      const venueName = 'Various' // Experiences might not have specific venue stock
      
      // Check if this matches a product in our reconciliation (by name matching)
      let foundInProducts = false
      for (const [key, record] of reconciliationMap.entries()) {
        if (record.product_name === itemName) {
          record.items_claimed += claim.qty || 0
          foundInProducts = true
          break
        }
      }
      
      // If not found in products, it's likely an experience
      if (!foundInProducts) {
        const expKey = `${itemName}-${venueName}`
        if (!experienceClaimsMap.has(expKey)) {
          experienceClaimsMap.set(expKey, {
            product_name: itemName,
            venue_name: venueName,
            stock_added: 0,
            stock_removed: 0,
            items_claimed: 0,
            current_stock: 0,
            calculated_stock: 0,
            variance: 0,
            type: 'experience' // This is an experience, no physical stock
          })
        }
        experienceClaimsMap.get(expKey).items_claimed += claim.qty || 0
      }
    })

    // Add current stock to products (experiences don't have stock)
    currentStock?.forEach(stock => {
      const product = Array.isArray(stock.products) ? stock.products[0] : stock.products
      const venue = Array.isArray(stock.venue) ? stock.venue[0] : stock.venue
      const productName = product?.name || 'Unknown'
      const venueName = venue?.name || 'Unknown'
      
      // Find matching reconciliation record by product_id and venue_id
      let matchedRecord = null
      for (const [key, record] of reconciliationMap.entries()) {
        if (record.product_id === stock.product_id && record.venue_id === stock.venue_id) {
          matchedRecord = record
          break
        }
      }
      
      if (matchedRecord && matchedRecord.type === 'product') {
        matchedRecord.current_stock = stock.qty_on_hand || 0
        console.log(`✅ MATCHED: ${productName} at ${venueName} = ${matchedRecord.current_stock}`)
      } else {
        console.log(`❌ NO MATCH: ${productName} at ${venueName} = ${stock.qty_on_hand}`)
        console.log(`Stock IDs: product_id=${stock.product_id}, venue_id=${stock.venue_id}`)
      }
    })

    // Calculate variances for products
    const productResults = Array.from(reconciliationMap.values()).map(record => {
      record.calculated_stock = record.stock_added - record.stock_removed - record.items_claimed
      record.variance = record.current_stock - record.calculated_stock
      return record
    })

    // Experience results (no stock variance, just tracking claims)
    const experienceResults = Array.from(experienceClaimsMap.values()).map(record => {
      record.calculated_stock = 0 // Experiences don't have calculated stock
      record.variance = 0 // No variance for experiences
      return record
    })

    // Combine all results
    const allResults = [...productResults, ...experienceResults]

    // Sort by variance (largest discrepancies first), then by type
    allResults.sort((a, b) => {
      const aVariance = Math.abs(a.variance)
      const bVariance = Math.abs(b.variance)
      if (aVariance !== bVariance) {
        return bVariance - aVariance // Largest variance first
      }
      // If same variance, products first, then experiences
      if (a.type !== b.type) {
        return a.type === 'product' ? -1 : 1
      }
      return 0
    })

    return NextResponse.json({
      summary: {
        total_items: allResults.length,
        total_products: productResults.length,
        total_experiences: experienceResults.length,
        items_with_variance: productResults.filter(r => r.variance !== 0).length,
        total_stock_added: totalStockAdded,
        total_stock_removed: totalStockRemoved,
        total_items_claimed: totalItemsClaimed,
        total_current_stock: totalCurrentStock
      },
      reconciliation: allResults,
      breakdown: {
        products: productResults,
        experiences: experienceResults
      }
    })

  } catch (error) {
    console.error('Error in reconciliation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
