import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')
    const venue_id = searchParams.get('venue_id')

    if (!product_id || !venue_id) {
      return NextResponse.json(
        { error: 'product_id and venue_id are required' },
        { status: 400 }
      )
    }

    console.log(`Fetching transactions for product_id: ${product_id}, venue_id: ${venue_id}`)

    // Get all transactions for this product/venue combination
    const transactions = []

    // 1. Stock additions (with staff member names)
    const { data: stockAdditions, error: stockError } = await supabase
      .from('stock_additions')
      .select(`
        id,
        quantity,
        notes,
        created_at,
        added_by,
        profiles!stock_additions_added_by_fkey (
          full_name
        )
      `)
      .eq('product_id', product_id)
      .eq('venue_id', venue_id)
      .order('created_at', { ascending: false })

    if (stockError) {
      console.error('Error fetching stock additions:', stockError)
    } else if (stockAdditions) {
      stockAdditions.forEach(addition => {
        transactions.push({
          type: addition.quantity > 0 ? 'stock_addition' : 'stock_removal',
          quantity: addition.quantity,
          created_at: addition.created_at,
          user_name: addition.profiles?.full_name || 'Unknown Staff',
          notes: addition.notes,
          source: 'stock_addition',
          id: addition.id
        })
      })
    }

    // 2. PIN purchases (with obfuscated emails)
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        created_at,
        orders!inner (
          id,
          email,
          created_at
        )
      `)
      .eq('product_id', product_id)
      .order('created_at', { ascending: false })

    if (orderError) {
      console.error('Error fetching order items:', orderError)
    } else if (orderItems) {
      orderItems.forEach(item => {
        transactions.push({
          type: 'purchase',
          quantity: item.quantity,
          created_at: item.created_at,
          email: item.orders.email,
          notes: `PIN purchase - Order #${item.orders.id}`,
          source: 'order_item',
          id: item.id
        })
      })
    }

    // 3. PIN claims (with staff member names who processed the claim)
    const { data: pinClaims, error: claimError } = await supabase
      .from('pin_claims')
      .select(`
        id,
        quantity_claimed,
        claimed_at,
        claimed_by,
        profiles!pin_claims_claimed_by_fkey (
          full_name
        ),
        order_items!inner (
          product_id,
          orders!inner (
            email,
            venue_id
          )
        )
      `)
      .eq('order_items.product_id', product_id)
      .eq('order_items.orders.venue_id', venue_id)
      .not('claimed_at', 'is', null)
      .order('claimed_at', { ascending: false })

    if (claimError) {
      console.error('Error fetching pin claims:', claimError)
    } else if (pinClaims) {
      pinClaims.forEach(claim => {
        transactions.push({
          type: 'claim',
          quantity: -claim.quantity_claimed, // Negative because it reduces stock
          created_at: claim.claimed_at,
          user_name: claim.profiles?.full_name || 'Unknown Staff',
          email: claim.order_items.orders.email,
          notes: `PIN claimed by staff`,
          source: 'pin_claim',
          id: claim.id
        })
      })
    }

    // Sort all transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`Found ${transactions.length} transactions for product/venue`)

    return NextResponse.json(transactions)

  } catch (error) {
    console.error('Error in transactions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
