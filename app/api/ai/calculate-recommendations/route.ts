import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface BodyProfile {
  weight: number
  leanBodyMass: number
  icwLbmRatio: number
  ecwTbwRatio: number
}

interface CurrentIntake {
  water: number
  sodium: number
  potassium: number
  magnesium: number
  calcium: number
  fiber: number
  protein: number
}

export async function POST(request: NextRequest) {
  try {
    const { profile, activityLevel, sweatLoss, currentIntake, planDuration } = await request.json()
    
    const supabase = await createClient()
    
    // Calculate daily targets based on profile
    const targets = calculateTargets(profile, activityLevel, sweatLoss)
    
    // Calculate deficits
    const deficits = {
      water: Math.max(0, targets.water - currentIntake.water),
      sodium: Math.max(0, targets.sodium - currentIntake.sodium),
      potassium: Math.max(0, targets.potassium - currentIntake.potassium),
      fiber: Math.max(0, targets.fiber - currentIntake.fiber),
      protein: Math.max(0, targets.protein - currentIntake.protein),
    }
    
    // Get ALL products with any nutritional data for AI-based recommendations
    // Don't filter by volume_ml as many products have nutrients but no volume
    const { data: productsWithStock } = await supabase
      .from("products")
      .select(`
        *,
        venue_stock!inner(qty_on_hand)
      `)
      .or('sodium_mg.not.is.null,potassium_mg.not.is.null,fiber_g.not.is.null,protein_g.not.is.null,water_content_ml.not.is.null')
      .gt("venue_stock.qty_on_hand", 0)
    
    // Clean up the products array to remove the nested venue_stock
    const products = productsWithStock?.map(p => {
      const { venue_stock, ...product } = p
      return product
    })
    
    console.log("Products with stock:", products?.slice(0, 2).map(p => ({ id: p.id, name: p.name })))
    
    if (!products || products.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }
    
    // Use OpenAI to intelligently select products based on deficits
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a hydration and nutrition expert recommending drinks from The Water Bar.
            
RULES:
1. ALWAYS recommend at least 3 items minimum (even if no deficits, suggest things to try)
2. Prioritize products that address the largest deficits
3. For each product, suggest appropriate quantities
4. Focus on the actual nutritional benefits

Return a JSON array of recommendations with this exact structure:
{
  "recommendations": [
    {
      "id": "product-uuid",
      "quantity": 1-3,
      "reason": "Brief explanation of why this helps"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Current deficits:
- Water: ${deficits.water}ml
- Sodium: ${deficits.sodium}mg
- Potassium: ${deficits.potassium}mg
- Fiber: ${deficits.fiber}g
- Protein: ${deficits.protein}g

Available products in stock:
${products.map(p => `- ${p.name} (ID: ${p.id})
  Water: ${p.water_content_ml}ml, Sodium: ${p.sodium_mg}mg, Potassium: ${p.potassium_mg}mg, Fiber: ${p.fiber_g}g, Protein: ${p.protein_g}g`).join('\n')}

Select the best products to address these deficits. If potassium deficit is high, prioritize coconut water. If fiber deficit exists, include Poppi or Rite Gut Health. For sodium, consider SoCelery.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      })
      
      const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{"recommendations": []}')
      
      // Map AI recommendations to full product details
      const recommendations = aiResponse.recommendations.map((rec: any) => {
        const product = products.find(p => p.id === rec.id)
        if (!product) return null
        
        return {
          id: product.id,
          name: product.name,
          quantity: rec.quantity || 1,
          sodium_mg: product.sodium_mg,
          potassium_mg: product.potassium_mg,
          fiber_g: product.fiber_g,
          protein_g: product.protein_g,
          water_content_ml: product.water_content_ml,
          price_aed: product.price_aed,
          reason: rec.reason,
        }
      }).filter(Boolean)
      
      // Ensure at least 3 items
      if (recommendations.length < 3) {
        const additionalProducts = products
          .filter(p => !recommendations.find((r: any) => r.id === p.id))
          .slice(0, 3 - recommendations.length)
          .map(product => ({
            id: product.id,
            name: product.name,
            quantity: 1,
            sodium_mg: product.sodium_mg,
            potassium_mg: product.potassium_mg,
            fiber_g: product.fiber_g,
            protein_g: product.protein_g,
            water_content_ml: product.water_content_ml,
            price_aed: product.price_aed,
            reason: "Recommended to explore",
          }))
        
        recommendations.push(...additionalProducts)
      }
      
      return NextResponse.json({ recommendations })
      
    } catch (error) {
      console.error("OpenAI error:", error)
      
      // Fallback to simple selection if AI fails
      const fallbackRecommendations = products.slice(0, 3).map(product => ({
        id: product.id,
        name: product.name,
        quantity: 1,
        sodium_mg: product.sodium_mg,
        potassium_mg: product.potassium_mg,
        fiber_g: product.fiber_g,
        protein_g: product.protein_g,
        water_content_ml: product.water_content_ml,
        price_aed: product.price_aed,
      }))
      
      return NextResponse.json({ recommendations: fallbackRecommendations })
    }
    
  } catch (error) {
    console.error("Error calculating recommendations:", error)
    return NextResponse.json({ recommendations: [] })
  }
}

function calculateTargets(profile: BodyProfile, activityLevel: string, sweatLoss: number) {
  const lbm = profile.leanBodyMass
  
  // SIMPLIFIED FOCUS TARGETS:
  
  // 1. HYDRATION - Base water: 33ml/kg LBM + sweat replacement
  const waterTotal = (33 * lbm + sweatLoss * 1000)
  
  // 2. ELECTROLYTES (key for hydration balance)
  // Potassium: 45mg/kg LBM base
  let potassiumBase = 45 * lbm
  if (profile.icwLbmRatio < 0.43) {
    potassiumBase *= 1.2  // ICW boost for cellular hydration
  }
  const potassiumTotal = potassiumBase + (195 * sweatLoss)
  
  // Sodium: Activity dependent
  let sodiumBase = (activityLevel === "desk" ? 35 : 50) * lbm
  if (profile.ecwTbwRatio > 0.4) {
    sodiumBase *= 0.8  // Reduce for puffiness
  }
  const sodiumTotal = sodiumBase + (920 * sweatLoss)
  
  // 3. PROTEIN - Critical for recovery
  const proteinTotal = activityLevel === "training" ? 1.5 * profile.weight : 1.2 * profile.weight
  
  // 4. FIBER - Gut health focus (Rite Greens target)
  const fiberTotal = 15  // 15g fiber target for gut health
  
  // 5. B-VITAMINS via Rite Greens (reverse calculated daily needs)
  // Based on Rite Greens providing: B6=1.54mg (110% RNI), B9=240mcg (120% RNI), B12=0.8mcg (53% RNI)
  const vitaminB6Total = 1.4  // Daily RNI
  const folateTotal = 200  // Daily RNI in mcg
  const vitaminB12Total = 1.5  // Daily RNI in mcg
  
  return {
    water: waterTotal,
    sodium: sodiumTotal,
    potassium: potassiumTotal,
    protein: proteinTotal,
    fiber: fiberTotal,
    // Skip calcium, magnesium - too complex for quick assessment
    // B-vitamins tracked but not used in scoring (Rite Greens handles this)
  }
}
