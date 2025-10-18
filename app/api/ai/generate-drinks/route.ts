// app/api/ai/generate-drinks/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Expects deficits (65% portion) + vitaminStatus from splitter
    const { 
      deficits,
      vitaminStatus,
      sessionDrinks = [],
      days_requested = 1,
      venueId
    } = body
    
    if (!deficits) {
      return NextResponse.json({ drinks: [], summary: "No deficits provided" })
    }

    const supabase = await createClient()
    
    // Get products with nutritional data that are in stock at the venue
    let productsQuery = supabase
      .from("products")
      .select("*")
      .neq("category", "drink") // Exclude mocktails
      .or("sodium_mg.not.is.null,potassium_mg.not.is.null,water_content_ml.not.is.null,fiber_g.not.is.null,magnesium_mg.not.is.null")
    
    // If venueId provided, only get products in stock at that venue
    if (venueId) {
      productsQuery = supabase
        .from("products")
        .select(`
          *,
          venue_stock!inner(qty_on_hand, venue_id)
        `)
        .neq("category", "drink")
        .or("sodium_mg.not.is.null,potassium_mg.not.is.null,water_content_ml.not.is.null,fiber_g.not.is.null,magnesium_mg.not.is.null")
        .eq("venue_stock.venue_id", venueId)
        .gt("venue_stock.qty_on_hand", 0)
    }
    
    const { data: productsRaw, error } = await productsQuery
    
    // Clean up products to remove venue_stock nested object
    const products = productsRaw?.map(p => {
      const { venue_stock, ...product } = p as any
      return product
    })

    if (error) throw error

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        drinks: [], 
        summary: "No products available in inventory" 
      })
    }

    // Build product list for GPT with slight randomization for variety
    const productList = products
      .sort(() => Math.random() - 0.2) // Slight shuffle, keeps best products near top
      .map((p: { id: any; name: any; category: any; image_url: any; water_content_ml: any; sodium_mg: any; potassium_mg: any; magnesium_mg: any; calcium_mg: any; fiber_g: any; soluble_fiber_g: any; vitamin_b6_mg: any; vitamin_b9_folate_mcg: any; vitamin_c_mg: any; polyphenols_mg: any; probiotic_cfu: any; vitamin_b12_mcg: any; iron_mg: any; price_aed: any; stripe_price_id: any }) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      image_url: p.image_url,
      nutrient_profile: {
        water_ml: Number(p.water_content_ml) || 0,
        sodium_mg: Number(p.sodium_mg) || 0,
        potassium_mg: Number(p.potassium_mg) || 0,
        magnesium_mg: Number(p.magnesium_mg) || 0,
        calcium_mg: Number(p.calcium_mg) || 0,
        fiber_g: Number(p.fiber_g) || 0,
        soluble_fiber_g: Number(p.soluble_fiber_g) || 0,
        vitamin_b6_mg: Number(p.vitamin_b6_mg) || 0,
        vitamin_b9_folate_mcg: Number(p.vitamin_b9_folate_mcg) || 0,
        vitamin_b12_mcg: Number(p.vitamin_b12_mcg) || 0,
        iron_mg: Number(p.iron_mg) || 0,
        vitamin_c_mg: Number(p.vitamin_c_mg) || 0,
        polyphenols_mg: Number(p.polyphenols_mg) || 0,
        probiotic_cfu: Number(p.probiotic_cfu) || 0,
      },
      price_aed: p.price_aed,
      stripe_price_id: p.stripe_price_id
    }))

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert hydration planner. Select drinks based on ACTUAL nutrient content.

CURRENT STATUS:
- Caffeine today: ${deficits.caffeine_count || 0} drinks
- Heavy sweater: ${deficits.sweat_flag ? 'YES' : 'NO'}
${deficits.caffeine_count >= 2 ? '⚠️ HIGH CAFFEINE: Consider METÉ as a gentler alternative!' : ''}

EXACT DEFICITS TO MEET:
- Water: ${deficits.water_ml}ml
- Sodium: ${Math.round(deficits.sodium_mg || 0)}mg ${deficits.sweat_flag ? '(PRIORITY - heavy sweater)' : ''}
- Potassium: ${Math.round(deficits.potassium_mg || 0)}mg
- Magnesium: ${Math.round(deficits.magnesium_mg || 0)}mg
- B6: ${(deficits.b6_mg || 0).toFixed(1)}mg
- B9/Folate: ${Math.round(deficits.b9_folate_mcg || 0)}mcg
- Fiber: ${(deficits.soluble_fiber_g || 0).toFixed(1)}g
- Polyphenols: ${Math.round(deficits.polyphenols_mg || 0)}mg

VARIETY RULES:
1. Mix categories - not all sachets or all juices
2. Rotate between options when deficits allow
3. Consider taste variety (sweet/savory/neutral)
4. Use quantities (2x) instead of always new products

SMART MATCHING:
- Sodium >200mg needed? → Celery (320mg) or 2x Coconut (130mg total)
- Potassium high? → Celery (750mg) beats Coconut (300mg)
- Magnesium deficit? → Check products for mg content
- B vitamins low? → Rite Greens has B6, B9, B12 (comprehensive support)
- Fiber 0-2g? → Skip fiber drinks
- Fiber 2-4g? → Poppi (2.3g)
- Fiber 5g+? → Rite Gut (5g)
- Had 2+ coffees? → PRIORITIZE METÉ (200mg polyphenols, gentler caffeine) 
- No caffeine yet + need polyphenols? → Kombucha (150mg) or Coffee (400mg)
- ALWAYS include METÉ if caffeine_count ≥ 2!

ALREADY HAD: ${sessionDrinks.join(", ") || "none"}
Don't repeat these.

Select 3-5 drinks that EXACTLY meet the deficits. Use the nutrient_profile in each product.
Vary your selections - don't always pick the same combo!

Return JSON:
{
  "drinks": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "quantity": 1,
      "reason": "PERSONALIZED explanation that includes: (1) Which specific deficit(s) this addresses, (2) How much it provides relative to what's needed (e.g., '30% of your sodium gap'), (3) Why this source is optimal (natural/balanced/gentle caffeine/etc.). Example: 'You need 1080mg sodium—this provides 320mg (30%) from natural celery, plus 750mg potassium to rebalance electrolytes after activity.'"
    }
  ],
  "summary": "Overall strategy for this hydration plan, highlighting the biggest deficits being addressed"
}`
        },
        {
          role: "user",
          content: JSON.stringify({
            deficits,
            vitaminStatus,
            availableProducts: productList,
            sessionDrinks,
            days_requested
          })
        }
      ],
      response_format: { type: "json_object" },
    })

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
    
    // Add full product details and calculate totals
    const enhancedDrinks = (result.drinks || []).map((rec: any) => {
      const product = productList.find((p: any) => p.id === rec.id)
      if (!product) return null
      
      return {
        id: rec.id,
        name: product.name,
        quantity: rec.quantity || 1,
        image_url: product.image_url,
        nutrients: product.nutrient_profile,
        price_aed: product.price_aed,
        reason: rec.reason
      }
    }).filter(Boolean)
    
    // Calculate total coverage
    const totalWater = enhancedDrinks.reduce((sum: number, d: any) => 
      sum + (d.nutrients.water_ml * d.quantity), 0)
    
    const totalSodium = enhancedDrinks.reduce((sum: number, d: any) => 
      sum + (d.nutrients.sodium_mg * d.quantity), 0)
    
    const totalPotassium = enhancedDrinks.reduce((sum: number, d: any) => 
      sum + (d.nutrients.potassium_mg * d.quantity), 0)
    
    const totalFiber = enhancedDrinks.reduce((sum: number, d: any) => 
      sum + (d.nutrients.fiber_g * d.quantity), 0)
    
    const totalPolyphenols = enhancedDrinks.reduce((sum: number, d: any) => 
      sum + (d.nutrients.polyphenols_mg * d.quantity), 0)
    
    const enhancedSummary = `${result.summary || ''}\n\n📊 Coverage: ${Math.round(totalWater)}ml water (${Math.round(deficits.water_ml || 0)}ml needed), ${Math.round(totalSodium)}mg sodium (${Math.round(deficits.sodium_mg || 0)}mg needed), ${Math.round(totalFiber)}g fiber`
    
    return NextResponse.json({ 
      drinks: enhancedDrinks,
      summary: enhancedSummary,
      totalNutrients: {
        water_ml: totalWater,
        sodium_mg: totalSodium,
        potassium_mg: totalPotassium,
        fiber_g: totalFiber,
        polyphenols_mg: totalPolyphenols
      },
      total_cost: enhancedDrinks.reduce((sum: number, d: any) => 
        sum + (Number(d.price_aed) || 0) * d.quantity, 0)
    })

  } catch (error) {
    console.error('Error generating drink recommendations:', error)
    return NextResponse.json(
      { 
        drinks: [], 
        summary: "Failed to generate recommendations" 
      },
      { status: 500 }
    )
  }
}