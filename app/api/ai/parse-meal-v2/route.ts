/**
 * FINAL PARSE-MEAL API (Supabase SDK + Responses API)
 *
 * - Accepts a meal as text (string).
 * - Extracts ingredients using GPT Responses API.
 * - Queries Supabase hydration_options with fuzzy search (ILIKE).
 * - Infers grams/portions with GPT.
 * - Totals nutrients server-side.
 * - Falls back to GPT nutrient estimates if DB has no match.
 * - Always returns flat JSON: { ingredients, nutrition, source }.
 */

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Nutrient shape
type Nutrition = {
  water: number; sodium: number; potassium: number; magnesium: number; calcium: number;
  fiber: number; protein: number; probiotics: number; omega3: number; polyphenols: number;
  caffeine: number; b6: number; b9: number; b12: number; iron: number; zinc: number;
  copper: number; choline: number; vitamin_c: number; vitamin_d: number;
  soluble_fiber: number; insoluble_fiber: number;
}

const EMPTY: Nutrition = {
  water: 0, sodium: 0, potassium: 0, magnesium: 0, calcium: 0,
  fiber: 0, protein: 0, probiotics: 0, omega3: 0, polyphenols: 0,
  caffeine: 0, b6: 0, b9: 0, b12: 0, iron: 0, zinc: 0,
  copper: 0, choline: 0, vitamin_c: 0, vitamin_d: 0,
  soluble_fiber: 0, insoluble_fiber: 0,
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function num(x: any) { const n = Number(x); return Number.isFinite(n) ? n : 0 }
function cloneEmpty(): Nutrition { return JSON.parse(JSON.stringify(EMPTY)) }
function sum(into: Nutrition, part: Partial<Nutrition>) {
  for (const k of Object.keys(EMPTY) as (keyof Nutrition)[]) {
    into[k] += num(part[k])
  }
}
function baseGramsFromName(name: string): number {
  const m = name.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/i)
  return m ? Number(m[1]) : 100
}

// Extract `output_text` safely from OpenAI responses
function getTextFromOutput(output: any): string {
  if (!output) return ""
  if (Array.isArray(output.content)) {
    const textPart = output.content.find((c: any) => c.type === "output_text")
    return textPart?.text ?? ""
  }
  return ""
}

// ──────────────────────────────────────────────
// SUPABASE QUERY
// ──────────────────────────────────────────────
async function fetchCandidatesFor(terms: string[]): Promise<any[]> {
  if (!terms.length) return []

  const { data, error } = await supabase
    .from("hydration_options")
    .select(`
      id, name,
      h2o_ml, na_mg, k_mg, mg_mg, calcium_mg,
      soluble_fiber_g, insoluble_fiber_g, protein_g,
      probiotic_cfu, omega3_mg, polyphenols_mg, caffeine_mg,
      b6_mg, b9_ug, b12_ug, iron_mg, zinc_mg, copper_mg,
      choline_mg, vitamin_c_mg, vitamin_d_ug
    `)
    .or(terms.map(t => `name.ilike.%${t}%`).join(","))
    .limit(100)

  if (error) {
    console.error("Supabase query error:", error)
    return []
  }

  return data || []
}

// ──────────────────────────────────────────────
// MAIN HANDLER
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const meal = typeof body.meal === "string" ? body.meal.trim() : ""

    if (!meal) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "supabase" })
    }

    // 1) INGREDIENT EXTRACTION
    const extract = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: `Return ONLY JSON: {"ingredients": string[]}.` },
        { role: "user", content: `Extract the main food ingredients from: "${meal}"` },
      ],
    })

    const rawExtract = getTextFromOutput(extract.output[0])
    const ingredients: string[] = JSON.parse(rawExtract || "{}").ingredients ?? []

    if (!ingredients.length) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "supabase" })
    }

    // 2) CANDIDATE FETCH FROM SUPABASE
    const candidates = await fetchCandidatesFor(ingredients)

    // 3) PORTION INFERENCE
    const mapResp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `Map foods to DB names and infer grams.
Return ONLY JSON:
{"mapped":[{"ingredient":string,"db_name":string,"grams":number}], "unmatched": string[]}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            meal,
            ingredients,
            candidate_db_names: candidates.map((r) => r.name),
          }),
        },
      ],
    })

    const rawMap = getTextFromOutput(mapResp.output[0])
    const plan = JSON.parse(rawMap || "{}")

    // 4) AGGREGATE NUTRIENTS
    const totals = cloneEmpty()
    const usedDbMap = Array.isArray(plan?.mapped) ? plan.mapped : []

    for (const entry of usedDbMap) {
      const row = candidates.find(
        (r) => r.name.toLowerCase() === entry.db_name.toLowerCase()
      )
      if (!row) continue

      const base = baseGramsFromName(row.name)
      const factor = (num(entry.grams) || 0) / base
      if (factor <= 0) continue

      sum(totals, {
        water: factor * num(row.h2o_ml),
        sodium: factor * num(row.na_mg),
        potassium: factor * num(row.k_mg),
        magnesium: factor * num(row.mg_mg),
        calcium: factor * num(row.calcium_mg),
        fiber: factor * (num(row.soluble_fiber_g) + num(row.insoluble_fiber_g)),
        protein: factor * num(row.protein_g),
        probiotics: factor * num(row.probiotic_cfu),
        omega3: factor * num(row.omega3_mg),
        polyphenols: factor * num(row.polyphenols_mg),
        caffeine: factor * num(row.caffeine_mg),
        b6: factor * num(row.b6_mg),
        b9: factor * num(row.b9_ug),
        b12: factor * num(row.b12_ug),
        iron: factor * num(row.iron_mg),
        zinc: factor * num(row.zinc_mg),
        copper: factor * num(row.copper_mg),
        choline: factor * num(row.choline_mg),
        vitamin_c: factor * num(row.vitamin_c_mg),
        vitamin_d: factor * num(row.vitamin_d_ug),
        soluble_fiber: factor * num(row.soluble_fiber_g),
        insoluble_fiber: factor * num(row.insoluble_fiber_g),
      })
    }

    // 5) FALLBACK FOR UNMATCHED
    let fallbackAdded = false
    if (plan?.unmatched?.length) {
      const fb = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: `Return ONLY JSON with estimated nutrition for unmatched foods:
{"items":[{"name":string,"grams":number,"water":number,"sodium":number,"potassium":number,"magnesium":number,"calcium":number,"fiber":number,"protein":number,"probiotics":number,"omega3":number,"polyphenols":number,"caffeine":number,"b6":number,"b9":number,"b12":number,"iron":number,"zinc":number,"copper":number,"choline":number,"vitamin_c":number,"vitamin_d":number,"soluble_fiber":number,"insoluble_fiber":number}]}`,
          },
          { role: "user", content: `Meal: ${meal}, Missing ingredients: ${plan.unmatched.join(", ")}` },
        ],
      })

      const rawFallback = getTextFromOutput(fb.output[0])
      const items = JSON.parse(rawFallback || "{}")?.items ?? []
      for (const it of items) sum(totals, it)
      fallbackAdded = items.length > 0
    }

    const source =
      fallbackAdded && usedDbMap.length ? "supabase+gpt_fallback"
      : fallbackAdded ? "gpt_fallback"
      : "supabase"

    return NextResponse.json({ ingredients, nutrition: totals, source })
  } catch (err) {
    console.error("parse-meal error:", err)
    return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "error" }, { status: 500 })
  }
}