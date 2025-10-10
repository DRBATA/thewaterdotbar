import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/orders/[orderId]/items
 * Fetch order items for email tracking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch order items with product details INCLUDING nutrients
    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        consumed,
        products (
          name,
          water_content_ml,
          sodium_mg,
          potassium_mg,
          magnesium_mg,
          calcium_mg,
          fiber_g,
          soluble_fiber_g,
          insoluble_fiber_g,
          protein_g,
          probiotic_cfu,
          omega3_mg,
          polyphenols_mg,
          vitamin_c_mg,
          vitamin_d_mcg
        )
      `)
      .eq('order_id', orderId);

    if (error) throw error;

    // Format response with full product nutrients
    const formattedItems = items?.map(item => {
      const product = item.products as any;
      return {
        id: item.id,
        product_id: item.product_id,
        product_name: product?.name || 'Unknown Product',
        quantity: item.quantity,
        consumed: item.consumed || false,
        nutrients: {
          water: product?.water_content_ml || 0,
          sodium: product?.sodium_mg || 0,
          potassium: product?.potassium_mg || 0,
          magnesium: product?.magnesium_mg || 0,
          calcium: product?.calcium_mg || 0,
          fiber: product?.fiber_g || 0,
          soluble_fiber: product?.soluble_fiber_g || 0,
          insoluble_fiber: product?.insoluble_fiber_g || 0,
          protein: product?.protein_g || 0,
          iron: 0, // Add if in products table
          zinc: 0,
          copper: 0,
          choline: 0,
          b6: 0,
          b9: 0,
          b12: 0,
          vitamin_c: product?.vitamin_c_mg || 0,
          vitamin_d: product?.vitamin_d_mcg || 0,
          caffeine: 0,
          probiotics: product?.probiotic_cfu || 0,
          omega3: product?.omega3_mg || 0,
          polyphenols: product?.polyphenols_mg || 0
        }
      };
    }) || [];

    return NextResponse.json({ items: formattedItems });

  } catch (error: any) {
    console.error('Error fetching order items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order items' },
      { status: 500 }
    );
  }
}
