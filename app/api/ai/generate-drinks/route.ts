import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { deficits, allergies = [] } = await request.json()
    
    if (!deficits) {
      return NextResponse.json({ drinks: [] })
    }

    const supabase = await createClient()
    
    // Calculate 50% of each deficit for drink recommendations (other 50% from meals)
    const drinkTargets = {
      water: deficits.water * 0.5,
      sodium: deficits.sodium * 0.5,
      potassium: deficits.potassium * 0.5,
      fiber: deficits.fiber * 0.5,
      protein: deficits.protein * 0.5,
    }

    // Stage 1: Search for drinks that can meet specific nutrient + volume thresholds
    const searchPromises = []
    
    // High sodium drinks (>150mg per serving)
    if (drinkTargets.sodium > 0) {
      searchPromises.push(
        supabase
          .from("products")
          .select("*")
          .gte("sodium_mg", Math.max(150, drinkTargets.sodium / 3))
          .not("volume_ml", "is", null)
          .limit(10)
      )
    }
    
    // High potassium drinks (>200mg per serving)
    if (drinkTargets.potassium > 0) {
      searchPromises.push(
        supabase
          .from("products")
          .select("*")
          .gte("potassium_mg", Math.max(200, drinkTargets.potassium / 3))
          .not("volume_ml", "is", null)
          .limit(10)
      )
    }
    
    // High fiber drinks (>1g per serving)
    if (drinkTargets.fiber > 0) {
      searchPromises.push(
        supabase
          .from("products")
          .select("*")
          .gte("fiber_g", Math.max(1, drinkTargets.fiber / 3))
          .not("volume_ml", "is", null)
          .limit(10)
      )
    }
    
    // High protein drinks (>3g per serving)
    if (drinkTargets.protein > 0) {
      searchPromises.push(
        supabase
          .from("products")
          .select("*")
          .gte("protein_g", Math.max(3, drinkTargets.protein / 3))
          .not("volume_ml", "is", null)
          .limit(10)
      )
    }
    
    // Plain water products for hydration
    if (drinkTargets.water > 0) {
      searchPromises.push(
        supabase
          .from("products")
          .select("*")
          .not("volume_ml", "is", null)
          .is("sodium_mg", null)
          .is("potassium_mg", null)
          .limit(5)
      )
    }

    const searchResults = await Promise.all(searchPromises)
    const relevantDrinks = searchResults.flatMap(result => result.data || [])
    
    // Remove duplicates and filter out allergens
    const uniqueDrinks = relevantDrinks.filter((drink, index, self) => 
      index === self.findIndex(d => d.id === drink.id) &&
      !allergies.some(allergy => drink.name.toLowerCase().includes(allergy.toLowerCase()))
    )

    if (uniqueDrinks.length === 0) {
      return NextResponse.json({ drinks: [] })
    }

    // Stage 2: AI creates drink combinations from targeted products
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a hydration specialist creating drink recommendations to fill 50% of nutritional deficits.

Target nutrients to fill (50% of total deficit - other 50% comes from meals):
- Water: ${drinkTargets.water}ml
- Sodium: ${drinkTargets.sodium}mg
- Potassium: ${drinkTargets.potassium}mg  
- Fiber: ${drinkTargets.fiber}g
- Protein: ${drinkTargets.protein}g

Available drinks (pre-filtered for deficits):
${uniqueDrinks.map(d => 
  `${d.name}: Volume=${d.volume_ml}ml, Na=${d.sodium_mg}mg, K=${d.potassium_mg}mg, Fiber=${d.fiber_g}g, Protein=${d.protein_g}g, Price=${d.price_aed}AED`
).join('\n')}

Create a drink plan that:
1. Meets volume needs first (${drinkTargets.water}ml total)
2. Splits nutrient needs intelligently (e.g., if need 400mg sodium, use 1 high-sodium drink + 2 plain waters)
3. Considers cost-effectiveness
4. Makes practical sense for consumption

Example logic:
- Need 1500ml + 200mg sodium → 1x SoCelery (300mg Na, 500ml) + 2x Prana Water (500ml each)
- Need 1000ml + 300mg K+ → 2x Coconut Water (290mg K+ each, 500ml each)

Return JSON:
{
  "drinks": [
    {
      "product_id": "uuid",
      "name": "Product name",
      "quantity": number,
      "volume_ml_total": number,
      "nutrients_provided": {
        "sodium": number,
        "potassium": number,
        "fiber": number,
        "protein": number
      },
      "price_aed_total": number,
      "reason": "Why this drink in this quantity"
    }
  ],
  "total_plan": {
    "volume_ml": number,
    "sodium": number,
    "potassium": number,
    "fiber": number,
    "protein": number,
    "cost_aed": number
  }
}`
        },
        {
          role: "user",
          content: `Create drink recommendations for these deficits. ${allergies.length > 0 ? `Avoid: ${allergies.join(', ')}` : ''}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Error generating drink recommendations:", error)
    return NextResponse.json({ drinks: [] })
  }
}
