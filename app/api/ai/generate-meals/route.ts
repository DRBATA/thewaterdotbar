import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deficits,
      allergies = [] as string[],
      previousMeals = [] as string[],
      includeSnacks = true,
      days_requested = 1
    } = body;

    if (!deficits) {
      return NextResponse.json({
        meals: [],
        snacks: [],
        summary: "No nutrient deficits provided."
      });
    }

    // ── 1️⃣ Fetch food list from Supabase
    const supabase = await createClient();
    const { data: foods, error } = await supabase
      .from("hydration_options")
      .select("*")
      .not("protein_g", "is", null);

    if (error) throw error;

    // ── 2️⃣ Filter out allergens
    const safeFoods = (foods || []).filter((food: { name: string; }) =>
      !allergies.some((a: string) =>
        food.name?.toLowerCase().includes(a.toLowerCase())
      )
    );

    // ── 3️⃣ Build the detailed food string for GPT
    const foodLines = safeFoods.map((f: { name: any; h2o_ml: any; protein_g: any; na_mg: any; k_mg: any; mg_mg: any; calcium_mg: any; soluble_fiber_g: any; insoluble_fiber_g: any; probiotic_cfu: any; omega3_mg: any; polyphenols_mg: any; caffeine_mg: any; b6_mg: any; b9_ug: any; b12_ug: any; iron_mg: any; zinc_mg: any; copper_mg: any; choline_mg: any; vitamin_c_mg: any; vitamin_d_ug: any; }) =>
      `${f.name}: H2O=${f.h2o_ml}mL, Protein=${f.protein_g}g,
       Na=${f.na_mg}mg, K=${f.k_mg}mg, Mg=${f.mg_mg}mg, Ca=${f.calcium_mg}mg,
       SolubleFiber=${f.soluble_fiber_g}g, InsolubleFiber=${f.insoluble_fiber_g}g,
       Probiotics=${f.probiotic_cfu}, Omega3=${f.omega3_mg}mg,
       Polyphenols=${f.polyphenols_mg}mg, Caffeine=${f.caffeine_mg}mg,
       B6=${f.b6_mg}mg, B9=${f.b9_ug}µg, B12=${f.b12_ug}µg,
       Iron=${f.iron_mg}mg, Zinc=${f.zinc_mg}mg, Copper=${f.copper_mg}mg,
       Choline=${f.choline_mg}mg, VitaminC=${f.vitamin_c_mg}mg,
       VitaminD=${f.vitamin_d_ug}µg`
    ).join("\n");

    // ── 4️⃣ Prompt
    const systemPrompt = `
You are a clinical nutrition planner.

Compose exactly **2 meals and 1 snack** to cover roughly **50% of today's nutrient gaps**
(the other 50% will be met by drinks).

Rules:
- Use ONLY foods from the provided list.
- Strictly avoid allergens.
- Avoid repeating any foods from these previous meals: ${previousMeals.join(", ") || "none"}.
- Optimise across all nutrients:
  protein, sodium, potassium, magnesium, calcium, fiber (soluble & insoluble),
  probiotics, omega3, polyphenols, caffeine, B6, B9, B12, iron,
  zinc, copper, choline, vitamin C, vitamin D, and water.
- If perfect matches are impossible, get as close as possible without overshooting portions.

Available foods (per serving):
${foodLines}

Return ONLY valid JSON:
{
  "meals": [
    { "name": string, "foods": string[], "nutrients": object, "explanation": string }
  ],
  "snacks": [
    { "name": string, "foods": string[], "nutrients": object, "explanation": string }
  ],
  "total_from_meals": object,
  "summary": string
}`;

    const userPrompt = `Deficits to cover: ${JSON.stringify(deficits)}
Allergies: ${allergies.join(", ") || "none"}
Include snack: ${includeSnacks}`;

    // ── 5️⃣ OpenAI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const result = JSON.parse(
      completion.choices[0].message?.content || "{}"
    );

    return NextResponse.json({
      meals: result.meals || [],
      snacks: result.snacks || [],
      total_from_meals: result.total_from_meals || {},
      summary: result.summary || ""
    });

  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    return NextResponse.json({
      meals: [],
      snacks: [],
      summary: "Meal generation failed."
    });
  }
}
