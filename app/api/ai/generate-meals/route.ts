// app/api/ai/generate-meals/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This now comes from the clean splitter (mealsPayload)
    const { 
      deficits,
      allergies = [],
      previousMeals = [],
      includeSnacks = true,
      days_requested = 1
    } = body
    
    if (!deficits) {
      return NextResponse.json({ meals: [] })
    }

    const supabase = await createClient()
    
    // Get all food items from hydration_options
    const { data: foods, error } = await supabase
      .from("hydration_options")
      .select("*")
      .not("protein_g", "is", null)

    if (error) throw error

    // Filter out allergens
    const safeFoods = (foods || []).filter(food => 
      !allergies.some((allergy: string) => 
        food.name?.toLowerCase().includes(allergy.toLowerCase())
      )
    )

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a clinical nutrition planner composing **meals + a snack** that close today's remaining **meal-side** gaps.

HARD GUARD:
- Use ONLY foods present in foods[].
- Respect allergies strictly.
- Avoid repeating the same core protein/starch from previousMeals[].
- If a gap cannot be met, say so explicitly (never hallucinate).

Available foods with nutrients per serving:
${safeFoods.map(f => 
  `${f.name}: Protein=${f.protein_g}g, Na=${f.na_mg}mg, K=${f.k_mg}mg, Fiber=${(f.soluble_fiber_g||0)+(f.insoluble_fiber_g||0)}g`
).join('\n')}

HOW TO REASON:
1) Identify limiting nutrients: protein_g, fiber_g, iron_mg, zinc_mg, choline_mg, omega3_mg, etc.
2) Compose 2-3 meals + 1 snack:
   - Each meal: 1 protein base + 1-2 sides/veg
   - Distribute coverage across meals (avoid huge portions)
   - Include 1 snack for gentle top-ups
3) Microbiome & polyphenols:
   - If probiotic_cfu == 0: include kefir or kraut/kimchi if present
   - If polyphenols low: add berries/cocoa/green tea if present
4) Iron + vitamin C pairing for absorption
5) Near-threshold flexibility: use snack instead of overbuilding meals
6) Variety: avoid repeating previousMeals

OUTPUT JSON:
{
  "meals": [
    {
      "name": "Salmon Bowl",
      "foods": ["salmon fillet", "quinoa", "spinach"],
      "nutrients": {
        "sodium": 300,
        "potassium": 800,
        "protein": 35,
        "fiber": 8
      },
      "explanation": "35g protein covers 77% of gap; omega-3 supports membranes"
    }
  ],
  "snacks": [
    {
      "name": "Kefir with berries",
      "nutrients": { "protein": 8, "probiotic_cfu": 1000000 },
      "explanation": "Microbiome seeding + polyphenols"
    }
  ],
  "total_from_meals": {
    "sodium": 585,
    "potassium": 520,
    "protein": 48,
    "fiber": 12
  },
  "summary": "Balanced protein across meals, kefir for probiotics, avoided nuts per allergy."
}`
        },
        {
          role: "user",
          content: `Generate meal suggestions for these deficits.
Deficits: ${JSON.stringify(deficits)}
Allergies: ${allergies.join(', ') || 'none'}
Previous meals to avoid: ${previousMeals.join(', ') || 'none'}
Include snacks: ${includeSnacks}`
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