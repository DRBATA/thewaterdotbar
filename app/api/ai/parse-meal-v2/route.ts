import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
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
  soluble_fiber: 0, insoluble_fiber: 0
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function num(x: any) { const n = Number(x); return Number.isFinite(n) ? n : 0 }
function cloneEmpty(): Nutrition { return { ...EMPTY } }
function sum(into: Nutrition, part: Partial<Nutrition>) {
  for (const k of Object.keys(EMPTY) as (keyof Nutrition)[]) into[k] += num(part[k])
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
      probiotic_cfu, omega3_mg, polyphenols_mg,
      caffeine_mg, b6_mg, b9_ug, b12_ug, iron_mg, zinc_mg,
      copper_mg, choline_mg, vitamin_c_mg, vitamin_d_ug
    `)
    .ilike("name", `%${terms[0]}%`) // simplification: match first term
    .limit(50)

  if (error) {
    console.error("Supabase error:", error)
    return []
  }
  return data ?? []
}

// ──────────────────────────────────────────────
// MAIN HANDLER
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const meal: string = body.meal ?? ""

    if (!meal.trim()) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "supabase" })
    }

    // 1) INGREDIENT EXTRACTION
    const extract = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Extract ingredients only. Return JSON {ingredients: string[]}." },
        { role: "user", content: meal }
      ]
    })

    const rawExtract = getTextFromOutput(extract.output[0])
    const ingredients: string[] = JSON.parse(rawExtract || "{}").ingredients ?? []
    if (!ingredients.length) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "supabase" })
    }

    // 2) SUPABASE CANDIDATES
    const candidates = await fetchCandidatesFor(ingredients)

    // 3) SIMPLE MATCHING (use first match only)
    const totals = cloneEmpty()
    for (const ing of ingredients) {
      const row = candidates.find(r =>
        String(r.name).toLowerCase().includes(ing.toLowerCase())
      )
      if (!row) continue
      sum(totals, {
        water: row.h2o_ml, sodium: row.na_mg, potassium: row.k_mg, magnesium: row.mg_mg, calcium: row.calcium_mg,
        fiber: row.soluble_fiber_g + row.insoluble_fiber_g, protein: row.protein_g, probiotics: row.probiotic_cfu,
        omega3: row.omega3_mg, polyphenols: row.polyphenols_mg, caffeine: row.caffeine_mg, b6: row.b6_mg,
        b9: row.b9_ug, b12: row.b12_ug, iron: row.iron_mg, zinc: row.zinc_mg, copper: row.copper_mg,
        choline: row.choline_mg, vitamin_c: row.vitamin_c_mg, vitamin_d: row.vitamin_d_ug,
        soluble_fiber: row.soluble_fiber_g, insoluble_fiber: row.insoluble_fiber_g
      })
    }

    return NextResponse.json({ ingredients, nutrition: totals, source: "supabase" })

  } catch (err) {
    console.error("parse-meal error:", err)
    return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "error" }, { status: 500 })
  }
}
