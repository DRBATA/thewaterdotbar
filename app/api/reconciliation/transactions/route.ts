import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Email obfuscation function for privacy
function obfuscateEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Unknown'
  
  const [username, domain] = email.split('@')
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`
  }
  
  const visibleChars = Math.max(1, Math.floor(username.length * 0.3))
  const hiddenChars = username.length - visibleChars
  return `${username.substring(0, visibleChars)}${'*'.repeat(hiddenChars)}@${domain}`
}

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
    const transactions: Array<{
      type: string
      quantity: number
      created_at: string
      user_name: string
      notes: string
      source: string
      id: string
    }> = []

    // 1. Stock additions (with staff member names)
    const { data: stockAdditions, error: stockError } = await supabase
      .from('stock_additions')
      .select(`
        id,
        quantity,
        notes,
        created_at,
        added_by
      `)
      .eq('product_id', product_id)
      .eq('venue_id', venue_id)
      .order('created_at', { ascending: false })

    if (!stockError && stockAdditions) {
      stockAdditions.forEach(addition => {
        transactions.push({
          type: addition.quantity > 0 ? 'stock_addition' : 'stock_removal',
          quantity: addition.quantity,
          created_at: addition.created_at,
          user_name: addition.added_by || 'Unknown Staff',
          notes: addition.notes || '',
          source: 'stock_addition',
          id: addition.id
        })
      })
    }

    // 2. Order items with claims (with obfuscated emails)
    const { data: orderItems, error: orderError } = await supabase
      .from('order_items')
      .select(`
        id,
        qty,
        claimed_at,
        email
      `)
      .eq('item_id', product_id)
      .not('claimed_at', 'is', null)
      .order('claimed_at', { ascending: false })

    if (!orderError && orderItems) {
      orderItems.forEach(item => {
        const obfuscatedEmail = obfuscateEmail(item.email)
        
        transactions.push({
          type: 'claim',
          quantity: -(item.qty || 1), // Negative because it reduces stock
          created_at: item.claimed_at,
          user_name: obfuscatedEmail,
          notes: `Item claimed by ${obfuscatedEmail}`,
          source: 'order_item',
          id: item.id
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
