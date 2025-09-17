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

    // First, use AI to identify key ingredients to search for
    const ingredientCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract the main food ingredients from a meal description. Return ONLY a JSON array of ingredient names to search for.

Examples:
- "carrot soup" → ["carrots"]
- "eggs and toast" → ["eggs", "bread"]  
- "chicken salad with tomatoes" → ["chicken", "lettuce", "tomatoes"]
- "coffee with milk" → ["coffee", "milk"]

Return format: {"ingredients": ["ingredient1", "ingredient2"]}`
        },
        {
          role: "user",
          content: `Extract ingredients from: "${meal}"`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const ingredientData = JSON.parse(ingredientCompletion.choices[0].message.content || '{"ingredients":[]}')
    const ingredients = ingredientData.ingredients || []

    if (ingredients.length === 0) {
      return NextResponse.json({
        water: 0, sodium: 0, potassium: 0, magnesium: 0,
        calcium: 0, fiber: 0, protein: 0, probiotics: 0,
        omega3: 0, polyphenols: 0
      })
    }

    const supabase = await createClient()
    
    // Search for only the specific ingredients identified by AI
    const searchPromises = ingredients.map(ingredient => 
      supabase
        .from("hydration_options")
        .select("name, h2o_ml, na_mg, k_mg, mg_mg, calcium_mg, soluble_fiber_g, insoluble_fiber_g, protein_g")
        .ilike("name", `%${ingredient}%`)
        .limit(3)
    )

    const searchResults = await Promise.all(searchPromises)
    const foundFoods = searchResults.flatMap(result => result.data || [])

    if (foundFoods.length === 0) {
      return NextResponse.json({
        water: 0, sodium: 0, potassium: 0, magnesium: 0,
        calcium: 0, fiber: 0, protein: 0, probiotics: 0,
        omega3: 0, polyphenols: 0
      })
    }

    // Now use AI to calculate portions with only the relevant foods
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutritionist calculating meal nutrients. You have these relevant foods from the database:

${foundFoods.map(f => `${f.name}: H2O=${f.h2o_ml}ml, Na=${f.na_mg}mg, K=${f.k_mg}mg, Mg=${f.mg_mg}mg, Ca=${f.calcium_mg}mg, Fiber=${(f.soluble_fiber_g||0)+(f.insoluble_fiber_g||0)}g, Protein=${f.protein_g}g`).join('\n')}

Calculate the total nutrients for the meal by estimating portions:
- "carrot soup" → ~200g carrots (typical bowl)
- "eggs and toast" → 2 eggs (100g) + 2 slices bread (60g)
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
          content: `Calculate nutrients for this ${mealType}: "${meal}"`
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
