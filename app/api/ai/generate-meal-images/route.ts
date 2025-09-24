import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    meals,
    allergies = [],
    previousMeals = [],
    keyDeficits = [] as string[] // e.g. ["potassium","magnesium","b12"]
  } = body;

  try {
    if (!meals || meals.length === 0) {
      return NextResponse.json({ meals: [] });
    }

    // 1️⃣ Filter meals against allergies & previous meals
    const safeMeals = meals.filter((meal: any) => {
      const mealFoodsStr = meal.foods.join(" ").toLowerCase();
      const hasAllergen = (allergies as string[]).some((a: string) =>
        mealFoodsStr.includes(a.toLowerCase())
      );
      const isRepeat = (previousMeals as string[]).some((prev: string) =>
        mealFoodsStr.includes(prev.toLowerCase())
      );
      return !hasAllergen && !isRepeat;
    });

    // 2️⃣ Build dynamic prompts with only key deficit nutrients
    const prompts = safeMeals.map((meal: any) => {
      const nutrientLines: string[] = [];
      (keyDeficits as string[]).forEach((k: string) => {
        if (meal.nutrients?.[k] !== undefined) {
          nutrientLines.push(`${k.replace(/_/g, " ")}: ${meal.nutrients[k]}`);
        }
      });

      return `
Create a square (1:1) infographic meal card.

TITLE (large bold top): ${meal.name}
MAIN PHOTO: Professional food photograph of ${meal.foods.join(", ")}.

NUTRITION BOX (right-side, clear text):
${nutrientLines.join("\n") || "Key nutrients balanced for today's needs."}

BENEFIT CALLOUT: "${meal.explanation || "Supports hydration and nutrition goals"}"
${allergies.length ? `ALLERGY WARNING (red box): Contains ${allergies.join(", ")}` : ""}

STYLE:
- Minimal, modern, bright food photography
- White/cream background, clean sans-serif fonts
- Clear hierarchy: Title → Image → Nutrition → Callout
- No watermarks or logos
      `;
    });

    // 3️⃣ Generate all images in parallel
    const results = await Promise.all(
      prompts.map((p: string) =>
        openai.images.generate({
          model: "gpt-image-1",
          prompt: p,
          size: "1024x1024",
          n: 1,
          response_format: "url"
        })
      )
    );

    // 4️⃣ Attach URLs back to meals
    const mealsWithImages = safeMeals.map((meal: any, idx: number) => ({
      ...meal,
      image_url: results[idx].data[0].url,
      image_type: "infographic_card",
      avoided_foods: previousMeals,
      filtered_allergies: allergies
    }));

    // 5️⃣ Track filtered-out meals
    const filteredMeals = (meals as any[])
      .filter((m: any) => !safeMeals.some((s: any) => s.name === m.name))
      .map((m: any) => ({
        ...m,
        image_url: null,
        image_type: "filtered",
        filtered_reason: "Contains allergens or repeats recent meals"
      }));

    return NextResponse.json({
      meals: [...mealsWithImages, ...filteredMeals],
      stats: {
        total: (meals as any[]).length,
        generated: mealsWithImages.length,
        filtered: filteredMeals.length
      }
    });
  } catch (error) {
    console.error("Error generating meal infographic cards:", error);
    return NextResponse.json({
      meals: meals || [],
      error: "Image generation failed, returning text-only meals"
    });
  }
}
