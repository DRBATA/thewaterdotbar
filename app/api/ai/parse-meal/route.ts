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
    
    // First search for foods that might match the meal description
    // Handle typos and variations
    let searchTerms = meal.toLowerCase().split(/[\s,]+/).filter(term => term.length > 2)
    
    // Common typo corrections
    searchTerms = searchTerms.map(term => {
      if (term === 'chicen' || term === 'chiken') return 'chicken'
      if (term === 'brocoli') return 'broccoli'
      if (term === 'tomatoe') return 'tomato'
      return term
    })
    
    const { data: foundFoods } = await supabase
      .from("hydration_options")
      .select("*")
      .or(searchTerms.map(term => `name.ilike.%${term}%`).join(','))
      .limit(20)

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
          content: `You are a nutritionist calculating meal nutrients. Be flexible and use your best judgment.

Available foods from database:
${foundFoods.map(f => 
  `${f.name}: H2O=${f.fluid_ml || 0}ml, Na=${f.na_mg || 0}mg, K=${f.k_mg || 0}mg, Mg=${f.mg_mg || 'null'}mg, Ca=${f.ca_mg || 'null'}mg, Fiber=${(f.soluble_fiber_g || 0) + (f.insoluble_fiber_g || 0)}g, Protein=${f.protein_g || 0}g`
).join('\n')}

Instructions:
1. Match user input to the most similar foods (handle typos, abbreviations)
2. If exact match not found, use closest alternatives
3. For generic items like "chicken soup", use chicken broth/miso or estimate
4. For typos like "chicen" → recognize as "chicken"
5. Estimate reasonable portions if not specified
6. ALWAYS return non-zero values when food is recognized

Examples:
- "chicen soup" → chicken soup → use Miso Broth (240ml) or similar
- "chicken soup" → estimate from chicken + broth components
- "eggs and toast" → 2 eggs (100g) + 2 slices bread (60g)

Return ONLY a JSON object with total nutrients:
{
  "water": number (ml),
  "sodium": number (mg),
  "potassium": number (mg),
  "magnesium": number (mg),
  "calcium": number (mg),
  "fiber": number (g),
  "protein": number (g)
`
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
