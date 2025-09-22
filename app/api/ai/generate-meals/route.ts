import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deficits,           // daily remaining nutrient gaps
      allergies = [],     // array of strings
      previousMeals = [], // array of meal names already eaten today
      includeSnacks = true,
      days_requested = 1,
    } = body;

    if (!deficits) {
      return NextResponse.json({
        meals: [], snacks: [], summary: "No deficits supplied."
      });
    }

    // ── 1️⃣ Fetch foods from Supabase
    const supabase = await createClient();
    const { data: foods, error } = await supabase
      .from("hydration_options")
      .select("*")
      .not("protein_g", "is", null);

    if (error) throw error;

    // ── 2️⃣ Remove any allergen matches
    const safeFoods = (foods || []).filter(food =>
      !allergies.some((a: string) =>
        food.name?.toLowerCase().includes(a.toLowerCase())
      )
    );

    // ── 3️⃣ Build detailed food list including all micronutrients
    const foodLines = safeFoods.map(f =>
      `${f.name}: H2O=${f.h2o_ml}mL, Protein=${f.protein_g}g, Na=${f.na_mg}mg,
       K=${f.k_mg}mg, Mg=${f.mg_mg}mg, Ca=${f.calcium_mg}mg,
       SolubleFiber=${f.soluble_fiber_g}g, InsolubleFiber=${f.insoluble_fiber_g}g,
       Probiotics=${f.probiotic_cfu}, Omega3=${f.omega3_mg}mg,
       Polyphenols=${f.polyphenols_mg}mg, Caffeine=${f.caffeine_mg}mg,
       B6=${f.b6_mg}mg, B9=${f.b9_ug}µg, B12=${f.b12_ug}µg,
       Iron=${f.iron_mg}mg, Zinc=${f.zinc_mg}mg, Copper=${f.copper_mg}mg,
       Choline=${f.choline_mg}mg, VitaminC=${f.vitamin_c_mg}mg, VitaminD=${f.vitamin_d_ug}µg`
    ).join("\n");

    const systemPrompt = `
You are a clinical nutrition planner.

Goal: compose exactly **2 meals and 1 snack** to close ~50% of today's nutrient gaps
(the remaining 50% will be covered by drinks).

Rules:
- Use ONLY foods listed below.
- Respect allergies.
- Avoid repeating any foods from this list of previous meals: ${previousMeals.join(", ") || "none"}.
- Cover as many of these nutrients as possible:
  protein, sodium, potassium, magnesium, calcium,
  total fiber, soluble fiber, insoluble fiber,
  probiotics, omega3, polyphenols, caffeine,
  B6, B9, B12, iron, zinc, copper,
  choline, vitamin C, vitamin D, water.
- If a perfect match is impossible, choose foods that bring totals as
  close as possible to each target without overbuilding portions.

Available foods (per serving):
${foodLines}

Return ONLY valid JSON:
{
  "meals": [ { "name": string, "foods": string[], "nutrients": object, "explanation": string } ],
  "snacks": [ { "name": string, "foods": string[], "nutrients": object, "explanation": string } ],
  "total_from_meals": object,
  "summary": string
}`;

    const userPrompt = `Deficits to cover with meals/snack: ${JSON.stringify(deficits)}
Allergies: ${allergies.join(", ") || "none"}
Remember: 2 meals + 1 snack only.`;

    // ── 4️⃣ Responses API call
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    // ── 5️⃣ Safe JSON parse
    let parsed: any = {};
    try {
      parsed = JSON.parse(resp.output_text || "{}");
    } catch (err) {
      console.error("Failed to parse meal JSON:", err, resp.output_text);
    }

    return NextResponse.json({
      meals: parsed.meals || [],
      snacks: parsed.snacks || [],
      total_from_meals: parsed.total_from_meals || {},
      summary: parsed.summary || ""
    });

  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    return NextResponse.json({
      meals: [], snacks: [], summary: "Meal generation failed."
    });
  }
}
