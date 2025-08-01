import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch ALL products without any stock filtering
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching all products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data?.length || 0} products for stock management`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in products-all GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
