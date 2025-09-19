import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { applyThresholdRules, applyRotationRules } from "@/lib/threshold-matrix-rules"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { deficits, allergies = [] } = await request.json()
    
    if (!deficits) {
      return NextResponse.json({ meals: [] })
    }

    const supabase = await createClient()
    
    // Calculate 50% of each deficit for food recommendations
    const foodTargets = {
      sodium: deficits.sodium * 0.5,
      potassium: deficits.potassium * 0.5,
      fiber: deficits.fiber * 0.5,
      protein: deficits.protein * 0.5,
    }

    // Stage 1: Search for foods that can meet specific nutrient thresholds
    const searchPromises = []
    
    // High potassium foods (>300mg per serving)
    if (foodTargets.potassium > 0) {
      searchPromises.push(
        supabase
          .from("hydration_options")
          .select("*")
          .gte("k_mg", Math.max(300, foodTargets.potassium / 3))
          .limit(10)
      )
    }
    
    // High protein foods (>15g per serving)
    if (foodTargets.protein > 0) {
      searchPromises.push(
        supabase
          .from("hydration_options")
          .select("*")
          .gte("protein_g", Math.max(15, foodTargets.protein / 3))
          .limit(10)
      )
    }
    
    // High fiber foods (>5g per serving)
    if (foodTargets.fiber > 0) {
      searchPromises.push(
        supabase
          .from("hydration_options")
          .select("*")
          .gte("soluble_fiber_g", Math.max(2, foodTargets.fiber / 4))
          .limit(10)
      )
      searchPromises.push(
        supabase
          .from("hydration_options")
          .select("*")
          .gte("insoluble_fiber_g", Math.max(3, foodTargets.fiber / 4))
          .limit(10)
      )
    }
    
    // High sodium foods (>200mg per serving) - if needed
    if (foodTargets.sodium > 0) {
      searchPromises.push(
        supabase
          .from("hydration_options")
          .select("*")
          .gte("na_mg", Math.max(200, foodTargets.sodium / 3))
          .limit(10)
      )
    }

    const searchResults = await Promise.all(searchPromises)
    const relevantFoods = searchResults.flatMap(result => result.data || [])
    
    // Remove duplicates and filter out allergens
    const uniqueFoods = relevantFoods.filter((food, index, self) => 
      index === self.findIndex(f => f.id === food.id) &&
      !allergies.some((allergy: string) => food.name.toLowerCase().includes(allergy.toLowerCase()))
    )

    if (uniqueFoods.length === 0) {
      return NextResponse.json({ meals: [] })
    }

    // Stage 2: AI creates meal combinations from targeted foods
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutritionist creating meal suggestions to fill 50% of nutritional deficits.

Target nutrients to fill (50% of total deficit):
- Sodium: ${foodTargets.sodium}mg
- Potassium: ${foodTargets.potassium}mg  
- Fiber: ${foodTargets.fiber}g
- Protein: ${foodTargets.protein}g

Available high-nutrient foods (pre-filtered for deficits):
${uniqueFoods.map(f => 
  `${f.name}: Na=${f.na_mg}mg, K=${f.k_mg}mg, SolFiber=${f.soluble_fiber_g}g, InsolFiber=${f.insoluble_fiber_g}g, Protein=${f.protein_g}g`
).join('\n')}

Create practical meal combinations that:
1. Use 1-3 foods per meal for simplicity
2. Target the highest deficits first
3. Make culinary sense (e.g., salmon + rice, not random combinations)
4. Consider portion sizes realistically

Examples:
- For protein + fiber: "Salmon sushi" (salmon for protein, rice for insoluble fiber)
- For potassium: "Banana smoothie" if bananas are available
- For sodium: "Miso soup" if miso is available

Return JSON:
{
  "meals": [
    {
      "name": "Meal name",
      "foods": ["food1", "food2"],
      "nutrients": {
        "sodium": number,
        "potassium": number,
        "fiber": number,
        "protein": number
      },
      "explanation": "Why this meal targets your specific deficits"
    }
  ],
  "total_from_meals": {
    "sodium": number,
    "potassium": number,
    "fiber": number,
    "protein": number
  }
}`
        },
        {
          role: "user",
          content: `Generate meal suggestions for these deficits. ${allergies.length > 0 ? `Avoid: ${allergies.join(', ')}` : ''}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Error generating meal suggestions:", error)
    return NextResponse.json({ meals: [] })
  }
}
