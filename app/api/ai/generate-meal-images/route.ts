import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { meals } = await request.json()
    
    if (!meals || meals.length === 0) {
      return NextResponse.json({ meals: [] })
    }

    // Create prompts for each meal
    const prompts = meals.map((meal: any) => `
Generate a realistic, appetizing food photograph.

Dish name: ${meal.name}
Main ingredients: ${meal.foods.join(", ")}

Style: professional food photography, natural lighting, shallow depth of field,
served on a clean plate, styled for a modern recipe website.
Do not add text, labels, or watermarks in the image.
`)

    // Run all image generations in parallel
    const imagePromises = prompts.map((prompt: string) =>
      openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        n: 1,
        response_format: "url"
      })
    )

    const results = await Promise.all(imagePromises)
    
    // Attach image URLs back to meal objects
    const mealsWithImages = meals.map((meal: any, idx: number) => ({
      ...meal,
      image_url: results[idx].data[0].url
    }))

    return NextResponse.json({ meals: mealsWithImages })
    
  } catch (error) {
    console.error("Error generating meal images:", error)
    // Return meals without images if generation fails
    return NextResponse.json({ meals })
  }
}
