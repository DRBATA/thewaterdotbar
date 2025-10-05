import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const productId = params.id;

    // Fetch product with hydration_options joined
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        description,
        price,
        image_url,
        hydration_options!hydration_options_product_id_fkey (
          h2o_ml,
          na_mg,
          k_mg,
          mg_mg,
          protein_g,
          soluble_fiber_g,
          insoluble_fiber_g,
          calcium_mg,
          iron_mg,
          zinc_mg,
          copper_mg,
          choline_mg,
          b6_mg,
          b9_ug,
          b12_ug,
          vitamin_c_mg,
          vitamin_d_ug,
          caffeine_mg,
          probiotic_cfu,
          omega3_mg,
          polyphenols_mg
        )
      `)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform hydration_options array to object
    const hydrationData = Array.isArray(product.hydration_options) && product.hydration_options.length > 0
      ? product.hydration_options[0]
      : null;

    // Map to NutritionalIntake format (all 24 nutrients)
    const nutrients = hydrationData ? {
      water: hydrationData.h2o_ml || 0,
      sodium: Number(hydrationData.na_mg) || 0,
      potassium: Number(hydrationData.k_mg) || 0,
      protein: Number(hydrationData.protein_g) || 0,
      fiber: (Number(hydrationData.soluble_fiber_g) || 0) + (Number(hydrationData.insoluble_fiber_g) || 0),
      soluble_fiber: Number(hydrationData.soluble_fiber_g) || 0,
      insoluble_fiber: Number(hydrationData.insoluble_fiber_g) || 0,
      magnesium: Number(hydrationData.mg_mg) || 0,
      calcium: Number(hydrationData.calcium_mg) || 0,
      iron: Number(hydrationData.iron_mg) || 0,
      zinc: Number(hydrationData.zinc_mg) || 0,
      copper: Number(hydrationData.copper_mg) || 0,
      choline: Number(hydrationData.choline_mg) || 0,
      b6: Number(hydrationData.b6_mg) || 0,
      b9: Number(hydrationData.b9_ug) || 0,
      b12: Number(hydrationData.b12_ug) || 0,
      vitamin_c: Number(hydrationData.vitamin_c_mg) || 0,
      vitamin_d: Number(hydrationData.vitamin_d_ug) || 0,
      caffeine: Number(hydrationData.caffeine_mg) || 0,
      probiotics: Number(hydrationData.probiotic_cfu) || 0,
      omega3: Number(hydrationData.omega3_mg) || 0,
      polyphenols: Number(hydrationData.polyphenols_mg) || 0
    } : null;

    return NextResponse.json({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      nutrients
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
