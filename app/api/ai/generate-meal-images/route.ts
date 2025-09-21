// app/api/ai/generate-meal-images/route.ts
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const requestBody = await request.json()
  const { 
    meals, 
    allergies = [], 
    previousMeals = [],
    deficitContext = {} // What deficits these meals are addressing
  } = requestBody

  try {
    
    if (!meals || meals.length === 0) {
      return NextResponse.json({ meals: [] })
    }

    // Filter out meals that contain allergens or repeat recent foods
    const safeMeals = meals.filter((meal: any) => {
      const mealFoodsStr = meal.foods.join(" ").toLowerCase()
      
      // Check for allergens
      const hasAllergen = allergies.some((allergy: string) => 
        mealFoodsStr.includes(allergy.toLowerCase())
      )
      
      // Check for repeated foods
      const isRepeat = previousMeals.some((prev: string) => 
        mealFoodsStr.includes(prev.toLowerCase())
      )
      
      return !hasAllergen && !isRepeat
    })

    // Create infographic prompts for each meal
    const prompts = safeMeals.map((meal: any) => {
      // Build nutrient display text
      const nutrientLines = []
      if (meal.nutrients?.sodium) nutrientLines.push(`Sodium: ${meal.nutrients.sodium}mg`)
      if (meal.nutrients?.potassium) nutrientLines.push(`Potassium: ${meal.nutrients.potassium}mg`)
      if (meal.nutrients?.protein) nutrientLines.push(`Protein: ${meal.nutrients.protein}g`)
      if (meal.nutrients?.fiber) nutrientLines.push(`Fiber: ${meal.nutrients.fiber}g`)
      if (meal.nutrients?.iron) nutrientLines.push(`Iron: ${meal.nutrients.iron}mg`)
      if (meal.nutrients?.omega3) nutrientLines.push(`Omega-3: ${meal.nutrients.omega3}mg`)
      
      // Build the prompt
      return `Create a clean, modern infographic meal card with these exact specifications:

MEAL TITLE (large, bold): ${meal.name}

MAIN IMAGE: Professional food photograph of ${meal.foods.join(", ")} arranged appetizingly

NUTRITION BOX (translucent overlay or side panel):
${nutrientLines.join('\n')}

BENEFIT CALLOUT: "${meal.explanation || 'Supports your hydration and nutrition goals'}"

${allergies.length > 0 ? `ALLERGY WARNING (red accent): Contains/May contain ${allergies.join(", ")}` : ''}

STYLE REQUIREMENTS:
- Clean, minimal design with maximum readability
- Bright, appetizing color scheme
- Professional food styling in the main image
- Clear hierarchy: Title > Image > Nutrition > Benefits
- Sans-serif fonts for clarity
- Consistent template feel across all cards
- Mobile-friendly layout (works at 1:1 ratio)
- No watermarks or logos

COLOR PALETTE:
- Background: Light, clean (white/cream)
- Nutrition box: Semi-transparent or soft color
- Text: High contrast for readability
- Accent: Brand blue/green for benefits
- Warning: Red for allergies if present`
    })

    // Generate all images in parallel
    const imagePromises = prompts.map((prompt: string) =>
      openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
        response_format: "url"
      })
    )

    const results = await Promise.all(imagePromises)
    
    // Attach image URLs back to meal objects
    const mealsWithImages = safeMeals.map((meal: any, idx: number) => ({
      ...meal,
      image_url: results[idx].data[0].url,
      image_type: "infographic_card",
      filtered_allergies: allergies,
      avoided_foods: previousMeals
    }))

    // Add placeholder for filtered meals
    const filteredMeals = meals.filter((meal: any) => 
      !safeMeals.some((safe: any) => safe.name === meal.name)
    ).map((meal: any) => ({
      ...meal,
      image_url: null,
      filtered_reason: "Contains allergens or repeats recent meals",
      image_type: "filtered"
    }))

    return NextResponse.json({ 
      meals: [...mealsWithImages, ...filteredMeals],
      stats: {
        total: meals.length,
        generated: mealsWithImages.length,
        filtered: filteredMeals.length
      }
    })
    
  } catch (error) {
    console.error("Error generating meal infographic cards:", error)
    // Return meals without images if generation fails
    return NextResponse.json({ 
      meals: meals || [],
      error: "Image generation failed, returning text-only meals"
    })
  }
}