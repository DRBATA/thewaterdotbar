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

    // Build product list for GPT
    const productList = products.map((p: { id: any; name: any; category: any; image_url: any; water_content_ml: any; sodium_mg: any; potassium_mg: any; magnesium_mg: any; calcium_mg: any; fiber_g: any; soluble_fiber_g: any; vitamin_b6_mg: any; vitamin_b9_folate_mcg: any; vitamin_c_mg: any; polyphenols_mg: any; probiotic_cfu: any; price_aed: any; stripe_price_id: any }) => ({
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
          content: `You are an expert hydration planner. CREATE INTERESTING, VARIED recommendations!

STOP being predictable! Mix it up based on context:

VARIETY RULES:
1. NEVER default to: Celery Juice + Coconut Water + Rite Gut + Rite Greens
2. Consider TIME OF DAY and ACTIVITY CONTEXT
3. Mix categories: Don't just pick all sachets or all juices

SMART SELECTION:
- Morning + Low Energy? → Art of Implosion Coffee (400ml water + energy)
- Post-workout? → Humantra sachet (balanced recovery)
- Afternoon slump? → METÉ (natural energy) or Kombucha (probiotics)
- Need fizz? → Maison Perrier varieties (330ml hydration + enjoyment)
- Fiber needed? → Alternate between Poppi (tasty) and Rite Gut (powerful)
- Pure hydration? → Mix Prana Water with flavored options

CONTEXTUAL PICKS:
-  sodium deficit + hate celery? → Once Upon A Coconut (also has 280mg sodium!)
- Want something fun? → Include a Ginger Shot boost


Be creative! Users want variety, not the same 4 products every time.
Maximum 3-4 products, but make them INTERESTING

EXPLANATION FORMAT for 'reason' field:
- Be specific: "Tackles X% of your Y deficit (provides Zmg)"
- Context matters: "Perfect for morning energy boost" or "Ideal post-workout recovery"
- Benefits: "Also includes bonus probiotics for gut health"
- Make it personal and motivating!

Vitamin Status: ${JSON.stringify(vitaminStatus)}

Return JSON:
{
  "drinks": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "quantity": 1,
      "image_url": "product image url from data",
      "nutrients": {
        "water": 330,
        "sodium": 200,
        "potassium": 100
      },
      "price": 55,
      "reason": "Addresses 40% of your sodium deficit (200mg of 500mg needed) while adding 330ml hydration. Perfect for post-workout recovery."
    }
  ],
  "summary": "Start with Humantra for electrolytes, then coconut water for potassium."
}`
        },
        {
          role: "user",
          content: `Deficits to address: ${JSON.stringify(deficits)}
Available products: ${JSON.stringify(productList)}
Session drinks already consumed: ${sessionDrinks.join(", ") || "none"}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')
    
    // Map AI recommendations to full product details for UI
    const drinks = (aiResponse.drinks || []).map((rec: any) => {
      const product = products.find((p: { id: any }) => p.id === rec.id)
      if (!product) return null
      
      return {
        id: product.id,
        name: product.name,
        quantity: rec.quantity || 1,
        category: product.category,
        nutrients: {
          water: Number(product.water_content_ml) || 0,
          sodium: Number(product.sodium_mg) || 0,
          potassium: Number(product.potassium_mg) || 0,
          magnesium: Number(product.magnesium_mg) || 0,
          fiber: Number(product.fiber_g) || 0,
        },
        price_aed: product.price_aed,
        stripe_price_id: product.stripe_price_id,
        reason: rec.reason,
        image_url: product.image_url
      }
    }).filter(Boolean)

    return NextResponse.json({
      drinks,
      summary: aiResponse.summary || "Hydration plan generated",
      total_cost: drinks.reduce((sum: number, d: any) => 
        sum + (Number(d.price_aed) || 0) * d.quantity, 0
      )
    })

  } catch (error) {
    console.error("Error generating drinks:", error)
    return NextResponse.json({ 
      drinks: [], 
      summary: "Failed to generate recommendations" 
    }, { status: 500 })
  }
}