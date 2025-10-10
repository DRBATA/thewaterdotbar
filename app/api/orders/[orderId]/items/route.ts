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

    // Fetch order items first
    const { data: orderItemsData, error: orderError } = await supabase
      .from('order_items')
      .select('id, item_id, quantity, consumed')
      .eq('order_id', orderId);

    if (orderError) {
      console.error('Error fetching order items:', orderError);
      throw orderError;
    }

    if (!orderItemsData || orderItemsData.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Get unique product IDs
    const productIds = [...new Set(orderItemsData.map(item => item.item_id))];

    // Fetch product details separately
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
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
      `)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Create product lookup map
    const productMap = new Map(
      productsData?.map(p => [p.id, p]) || []
    );

    // Format response with full product nutrients
    const formattedItems = orderItemsData.map(item => {
      const product = productMap.get(item.item_id);
      return {
        id: item.id,
        product_id: item.item_id,  // Use item_id as product_id
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
