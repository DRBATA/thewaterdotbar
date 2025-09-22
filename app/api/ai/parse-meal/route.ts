import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function getSuggestionsForFood(food: string): string[] {
  const suggestions: Record<string, string[]> = {
    'soup': ['chicken soup', 'tomato soup', 'vegetable soup', 'lentil soup', 'mushroom soup'],
    'salad': ['caesar salad', 'greek salad', 'garden salad', 'chicken salad', 'tuna salad'],
    'pasta': ['spaghetti bolognese', 'chicken alfredo', 'penne arrabbiata', 'carbonara', 'mac and cheese'],
    'sandwich': ['chicken sandwich', 'tuna sandwich', 'ham sandwich', 'veggie sandwich', 'club sandwich'],
    'curry': ['chicken curry', 'beef curry', 'vegetable curry', 'thai curry', 'indian curry'],
    'pizza': ['margherita pizza', 'pepperoni pizza', 'vegetable pizza', 'meat lovers pizza', 'hawaiian pizza'],
    'smoothie': ['berry smoothie', 'banana smoothie', 'green smoothie', 'protein smoothie', 'tropical smoothie'],
    'stir fry': ['chicken stir fry', 'vegetable stir fry', 'beef stir fry', 'shrimp stir fry', 'tofu stir fry']
  }
  return suggestions[food] || []
}

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
    
    // First extract ingredients using AI
    const ingredientExtraction = await openai.chat.completions.create({
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
- "cereal" → ["cereal", "milk"] 
- "pasta" → ["pasta", "tomato", "cheese"] 
- "sandwich" → ["bread", "meat", "cheese"]
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

    const extractedIngredients = JSON.parse(ingredientExtraction.choices[0].message.content || '{"ingredients": []}')
    const extractedItems = extractedIngredients.ingredients || []
    
    // Check if input is too vague and needs clarification
    const vagueFoods = ['soup', 'salad', 'pasta', 'sandwich', 'curry', 'stir fry', 'smoothie', 'pizza']
    const isVague = vagueFoods.some(vague => meal.toLowerCase().includes(vague)) && meal.split(' ').length <= 2
    
    if (isVague) {
      return NextResponse.json({
        needsClarification: true,
        question: `What type of ${meal.toLowerCase()}? For example: chicken soup, caesar salad, margherita pizza, etc.`,
        suggestions: getSuggestionsForFood(meal.toLowerCase()),
        water: 0, sodium: 0, potassium: 0, magnesium: 0,
        calcium: 0, fiber: 0, protein: 0, probiotics: 0,
        omega3: 0, polyphenols: 0
      })
    }
    
    // If no ingredients extracted, fall back to simple word splitting
    let searchTerms = extractedItems.length > 0 
      ? extractedItems 
      : meal.toLowerCase().split(/[\s,]+/).filter((term: string) => term.length > 2)
    
    // Common typo corrections
    searchTerms = searchTerms.map((term: string) => {
      if (term === 'chicen' || term === 'chiken') return 'chicken'
      if (term === 'brocoli') return 'broccoli'
      if (term === 'tomatoe') return 'tomato'
      return term
    })
    
    const { data: foundFoods } = await supabase
      .from("hydration_options")
      .select("*")
      .or(searchTerms.map((term: string) => `name.ilike.%${term}%`).join(','))
      .limit(20)

    if (!foundFoods || foundFoods.length === 0) {
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
${foundFoods.map(f => {
  const nutrients = []
  if (f.h2o_ml) nutrients.push(`H2O=${f.h2o_ml}ml`)
  if (f.na_mg) nutrients.push(`Na=${f.na_mg}mg`)
  if (f.k_mg) nutrients.push(`K=${f.k_mg}mg`)
  if (f.mg_mg) nutrients.push(`Mg=${f.mg_mg}mg`)
  if (f.ca_mg) nutrients.push(`Ca=${f.ca_mg}mg`)
  if (f.soluble_fiber_g || f.insoluble_fiber_g) nutrients.push(`Fiber=${(f.soluble_fiber_g || 0) + (f.insoluble_fiber_g || 0)}g`)
  if (f.protein_g) nutrients.push(`Protein=${f.protein_g}g`)
  if (f.polyphenols_mg) nutrients.push(`Polyphenols=${f.polyphenols_mg}mg`)
  if (f.probiotic_cfu) nutrients.push(`Probiotics=${f.probiotic_cfu}CFU`)
  if (f.omega3_mg) nutrients.push(`Omega3=${f.omega3_mg}mg`)
  if (f.vitamin_c_mg) nutrients.push(`VitC=${f.vitamin_c_mg}mg`)
  if (f.vitamin_d_ug) nutrients.push(`VitD=${f.vitamin_d_ug}μg`)
  if (f.iron_mg) nutrients.push(`Iron=${f.iron_mg}mg`)
  if (f.zinc_mg) nutrients.push(`Zinc=${f.zinc_mg}mg`)
  if (f.caffeine_mg) nutrients.push(`Caffeine=${f.caffeine_mg}mg`)
  if (f.b6_mg) nutrients.push(`B6=${f.b6_mg}mg`)
  if (f.b9_ug) nutrients.push(`B9=${f.b9_ug}μg`)
  if (f.b12_ug) nutrients.push(`B12=${f.b12_ug}μg`)
  if (f.copper_mg) nutrients.push(`Copper=${f.copper_mg}mg`)
  if (f.choline_mg) nutrients.push(`Choline=${f.choline_mg}mg`)
  return `${f.name}: ${nutrients.join(', ')}`
}).join('\n')}

Instructions:
1. Match user input to the most similar foods from the database list above
2. Use EXACT values from database when available - DO NOT guess or estimate
3. For "fried chicken x3" → find "Fried Chicken (3 pcs)" in database and use its exact values
4. For missing nutrients in database items, return 0 - do not estimate
5. Only estimate water content: soups/stews 200-300ml, regular meals 50-100ml
6. Combine multiple database items when meal has multiple components
7. Use reasonable portion sizes: 1 serving unless specified otherwise
8. Return database values exactly as shown - no modifications

Examples:
- "chicken fried x3" → Find "Fried Chicken (3 pcs)" in database, use exact values: Na=220mg, Protein=0g
- "beans" → Find closest bean item in database, use exact values from that item
- "potato waffle" → Find "Potato" item in database, use exact values: Na=10mg, K=900mg, Fiber=3g, Protein=4g

Return JSON only with these exact fields:
{
  "water": number (ml),
  "sodium": number (mg),
  "potassium": number (mg),
  "magnesium": number (mg),
  "calcium": number (mg),
  "fiber": number (g),
  "protein": number (g),
  "probiotics": number (billion CFU),
  "omega3": number (mg),
  "polyphenols": number (mg),
  "caffeine": number (mg),
  "b6": number (mg),
  "b9": number (μg folate),
  "b12": number (μg),
  "iron": number (mg),
  "zinc": number (mg),
  "copper": number (mg),
  "choline": number (mg),
  "vitamin_c": number (mg),
  "vitamin_d": number (μg),
  "soluble_fiber": number (g),
  "insoluble_fiber": number (g),
  "explanation": "Brief explanation of what was detected and calculated"
}, e.g. 'Found chicken breast and potato in database, estimated water content for regular meal'
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
      probiotics: parsed.probiotics || 0,
      omega3: parsed.omega3 || 0,
      polyphenols: parsed.polyphenols || 0,
      explanation: parsed.explanation || "Nutritional analysis completed"
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
