// app/api/ai/generate-drinks/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type Product = {
  id: string
  name: string
  category?: string | null
  water_content_ml?: number | null
  sodium_mg?: number | null
  potassium_mg?: number | null
  magnesium_mg?: number | null
  soluble_fiber_g?: number | null
  fiber_g?: number | null
  vitamin_b6_mg?: number | null
  vitamin_b9_folate_mcg?: number | null
  vitamin_c_mg?: number | null
  polyphenols_mg?: number | null
  caffeine_mg?: number | null
  probiotic_cfu?: number | null
}

function normalizeProduct(p: any): Product & { nutrient_profile: any } {
  // Helper to safely get numbers
  const num = (v: any) =>
    v === null || v === undefined ? null :
    typeof v === "number" ? v :
    typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) :
    null;

  // Build canonical nutrient profile
  const nutrient_profile = {
    water_ml: num(p.water_content_ml) || num(p.volume_ml) || 0,
    sodium_mg: num(p.sodium_mg) || 0,
    potassium_mg: num(p.potassium_mg) || 0,
    magnesium_mg: num(p.magnesium_mg) || 0,
    soluble_fiber_g: num(p.soluble_fiber_g) || 0,
    fiber_g: num(p.fiber_g) || 0,
    vitamin_b6_mg: num(p.vitamin_b6_mg) || 0,
    vitamin_b9_folate_mcg: num(p.vitamin_b9_folate_mcg) || 0,
    vitamin_c_mg: num(p.vitamin_c_mg) || 0,
    polyphenols_mg: num(p.polyphenols_mg) || 0,
    caffeine_mg: num(p.caffeine_mg) || 0,
  };

  return {
    ...p,
    nutrient_profile
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This now comes from the clean splitter (drinksPayload)
    const { 
      deficits,
      sessionDrinks = [],
      days_requested = 1
    } = body
    
    if (!deficits) {
      return NextResponse.json({ drinks: [] })
    }

    const supabase = await createClient()
    
    // Get products with nutritional data
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .not("sodium_mg", "is", null)
      .or("potassium_mg.not.is.null,water_content_ml.not.is.null,fiber_g.not.is.null")
      .eq("category", "drink")

    if (error) throw error

    const normalizedProducts = (products || []).map(normalizeProduct)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert hydration & functional beverage planner that builds **today-only** plans from a **product table**.

HARD GUARD:
- Use ONLY products provided in products[].
- NEVER mention or invent an item not present.
- If no product covers a gap, say so explicitly in "reason".

INPUTS:
- Drink-side deficits for today (already split 35/65 with meals).
- A list of products with canonical nutrient_profile fields per serving.
- Session drinks already consumed (avoid repeating unless necessary).

THRESHOLDS & TRIGGERS (apply to drink-side gaps):
- Hydration: if water_ml > 0 → close ~80–100% with ≤3 items total.
  - If water_ml < 750 → limit to 1 item or 1 sachet + 1 small drink.
- Sodium: >300 mg → add 1 electrolyte fix (e.g., Humantra); >800 mg → up to 2 fixes (cap 2/day).
- Potassium: >400 mg → include a K-forward product if available.
- Mg or B-vitamins: Mg <250 mg OR B6 <0.8 mg OR Folate <200 µg → include a B/Mg product if present.
- Soluble fiber (drink-side): 
  - Small gap (≤3-5 g) → Poppi or similar low-fiber drink
  - Larger gap (>5 g) → Rite Gut Health or higher-fiber option
- Polyphenols & gut signalling: if polyphenols low (<250-300 mg) → kombucha (1) framed as **gut-signalling/adaptogenic**, not probiotic.
- Caffeine governance: if caffeine_count > 4, prefer non-caffeinated products.
- Near-threshold generosity: if within 10-15% of a trigger AND water_ml > 750, OK to include the fix.
- Diversity caps: NEVER >2 of the same product/day; prefer 1 functional + 1 sensory if fluid budget allows.

PLAN-BUILDING:
1) Compute contribution of each product to each gap.
2) Prefer multi-gap efficiency (e.g., electrolytes + water + Mg).
3) Respect caffeine governance and per-product caps.
4) Each line must include numeric + mechanistic reason (e.g., "200mg sodium = 44% gap; supports ECF volume").
5) Summary should be a 1-2 sentence ritual.

OUTPUT JSON:
{
  "drinks": [
    { 
      "id": "product-id",
      "name": "Product Name",
      "quantity": 1,
      "nutrients": { "sodium": 200, "potassium": 100, "water": 500 },
      "reason": "200mg sodium covers 44% of gap; supports ECF volume & nerve conduction"
    }
  ],
  "summary": "Start with Humantra for electrolytes, enjoy kombucha mid-day for gut signalling."
}`
        },
        {
          role: "user",
          content: JSON.stringify({
            deficits,
            products: normalizedProducts,
            sessionDrinks,
            days_requested
          })
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Error generating drink recommendations:", error)
    return NextResponse.json({ drinks: [] })
  }
}