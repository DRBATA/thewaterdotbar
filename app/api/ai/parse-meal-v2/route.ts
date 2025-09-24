// app/api/ai/parse-meal/route.ts

import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// ─────────────────────────────
// TYPES
// ─────────────────────────────
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

// ─────────────────────────────
// HELPERS
// ─────────────────────────────
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
function getText(output: any): string {
  if (!output) return ""
  if (Array.isArray(output.content)) {
    const t = output.content.find((c: any) => c.type === "output_text")
    return t?.text ?? ""
  }
  return ""
}

// ─────────────────────────────
// SUPABASE LOOKUP
// ─────────────────────────────
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
    console.error("Supabase error:", error)
    return []
  }
  return data || []
}

// ─────────────────────────────
// MAIN HANDLER
// ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const meal = typeof body.meal === "string" ? body.meal.trim() : ""

    if (!meal) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "none" })
    }

    // 1) INGREDIENT + PORTION EXTRACTION
    const extract = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Expand the meal into explicit ingredients and infer portions in grams.
Return ONLY JSON like:
{"ingredients":[{"name":string,"grams":number,"cooking":string}]}` },
        { role: "user", content: meal },
      ],
    })

    const parsed = JSON.parse(extract.choices[0].message?.content ?? "{}")
    const ingredients: { name: string; grams: number; cooking?: string }[] = parsed.ingredients ?? []
    if (!ingredients.length) {
      return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "none" })
    }

    // 2) SUPABASE MATCHING
    const candidates = await fetchCandidatesFor(ingredients.map(i => i.name))

    // 3) TOTALS
    const totals = cloneEmpty()
    let fallbackNeeded: string[] = []

    for (const ing of ingredients) {
      const row = candidates.find(r =>
        String(r.name).toLowerCase().includes(ing.name.toLowerCase())
      )
      if (!row) {
        fallbackNeeded.push(ing.name)
        continue
      }

      const base = baseGramsFromName(row.name)
      const factor = (num(ing.grams) || 0) / base
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

    // 4) FALLBACK FOR UNMATCHED
    if (fallbackNeeded.length) {
      const fb = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `Estimate nutrients for the given foods (100g if unspecified).
Return ONLY JSON with WHOLE NUMBERS (no decimals): {"items":[{name:string,grams:number,...nutrients}]}` },
          { role: "user", content: `Foods: ${fallbackNeeded.join(", ")}` },
        ],
      })

      const items = JSON.parse(fb.choices[0].message?.content ?? "{}")?.items ?? []
      for (const it of items) sum(totals, it)
    }

    const source =
      fallbackNeeded.length && candidates.length ? "supabase+gpt_fallback"
      : fallbackNeeded.length ? "gpt_fallback"
      : "supabase"

    // Round all values to whole numbers
    for (const key of Object.keys(totals) as (keyof Nutrition)[]) {
      totals[key] = Math.round(totals[key])
    }

    return NextResponse.json({ ingredients, nutrition: totals, source })
  } catch (err) {
    console.error("parse-meal error:", err)
    return NextResponse.json({ ingredients: [], nutrition: cloneEmpty(), source: "error" }, { status: 500 })
  }
}
