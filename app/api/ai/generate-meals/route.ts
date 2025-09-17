import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { deficits } = await request.json()
    
    if (!deficits) {
      return NextResponse.json({ meals: [] })
    }

    const supabase = createClient()
    
    // Get hydration options that could help with deficits
    const { data: hydrationOptions } = await supabase
      .from("hydration_options")
      .select("*")
      .eq("category", "food")
      .limit(50)

    // Calculate 50% of each deficit for food recommendations
    const foodTargets = {
      sodium: deficits.sodium * 0.5,
      potassium: deficits.potassium * 0.5,
      fiber: deficits.fiber * 0.5,
      protein: deficits.protein * 0.5,
    }

    // Use GPT-4o-mini to generate meal suggestions
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

Available foods in database:
${hydrationOptions?.map(f => 
  `${f.name}: Na=${f.na_mg}mg, K=${f.k_mg}mg, Fiber=${(f.soluble_fiber_g||0)+(f.insoluble_fiber_g||0)}g, Protein=${f.protein_g}g`
).join('\n')}

Create a practical meal plan that fills approximately 50% of the deficits using foods from the database.
Focus on combinations that make culinary sense.

Return a JSON object:
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
      "explanation": "Why this meal helps"
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
          content: "Generate meal suggestions for these deficits"
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
