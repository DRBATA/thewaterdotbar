import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { meal, mealType } = await request.json()
    
    if (!meal || !meal.trim()) {
      return NextResponse.json({ 
        water: 0, sodium: 0, potassium: 0, magnesium: 0, 
        calcium: 0, fiber: 0, protein: 0, probiotics: 0, 
        omega3: 0, polyphenols: 0 
      })
    }

    const supabase = createClient()
    
    // Get all hydration options for context
    const { data: hydrationOptions } = await supabase
      .from("hydration_options")
      .select("name, h2o_ml, na_mg, k_mg, mg_mg, calcium_mg, soluble_fiber_g, insoluble_fiber_g, protein_g")
      .limit(100)

    // Use GPT-4o-mini to parse meal and match to database
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutritionist parsing meal descriptions and matching them to a database.
          
Available foods in database (name, water_ml, sodium_mg, potassium_mg, magnesium_mg, calcium_mg, fiber_g, protein_g):
${hydrationOptions?.map(f => `${f.name}: H2O=${f.h2o_ml}ml, Na=${f.na_mg}mg, K=${f.k_mg}mg, Mg=${f.mg_mg}mg, Ca=${f.calcium_mg}mg, Fiber=${(f.soluble_fiber_g||0)+(f.insoluble_fiber_g||0)}g, Protein=${f.protein_g}g`).join('\n')}

Parse the meal description and estimate portions. For example:
- "carrot soup" → ~200g carrots (typical bowl)
- "eggs and toast" → 2 eggs (100g) + 2 slices bread
- "small salad" → ~100g mixed greens

Return ONLY a JSON object with total nutrients:
{
  "water": number (ml),
  "sodium": number (mg),
  "potassium": number (mg),
  "magnesium": number (mg),
  "calcium": number (mg),
  "fiber": number (g),
  "protein": number (g)
}`
        },
        {
          role: "user",
          content: `Parse this ${mealType}: "${meal}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const parsed = JSON.parse(completion.choices[0].message.content || "{}")
    
    return NextResponse.json({
      water: parsed.water || 0,
      sodium: parsed.sodium || 0,
      potassium: parsed.potassium || 0,
      magnesium: parsed.magnesium || 0,
      calcium: parsed.calcium || 0,
      fiber: parsed.fiber || 0,
      protein: parsed.protein || 0,
      probiotics: 0, // Not tracked in simple parsing
      omega3: 0, // Not tracked in simple parsing
      polyphenols: 0 // Not tracked in simple parsing
    })
    
  } catch (error) {
    console.error("Error parsing meal with AI:", error)
    return NextResponse.json({ 
      water: 0, sodium: 0, potassium: 0, magnesium: 0, 
      calcium: 0, fiber: 0, protein: 0, probiotics: 0, 
      omega3: 0, polyphenols: 0 
    })
  }
}
