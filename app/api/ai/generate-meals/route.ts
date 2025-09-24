// app/api/ai/generate-meals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ───────────────────────────────────────────────────────────────────────────────
// Helpers: mapping, math, parsing
// ───────────────────────────────────────────────────────────────────────────────

/** Map deficit keys → DB column(s). Fiber maps to two columns; b12 uses µg in DB. */
const DEFICIT_TO_COLUMNS: Record<string, string[] | undefined> = {
  water_ml: ["h2o_ml"],
  sodium_mg: ["na_mg"],
  potassium_mg: ["k_mg"],
  magnesium_mg: ["mg_mg"],
  calcium_mg: ["calcium_mg"],
  fiber_g: ["soluble_fiber_g", "insoluble_fiber_g"],
  protein_g: ["protein_g"],
  probiotic_cfu: ["probiotic_cfu"],
  omega3_mg: ["omega3_mg"],
  polyphenols_mg: ["polyphenols_mg"],
  caffeine_mg: ["caffeine_mg"],
  b6_mg: ["b6_mg"],
  b9_ug: ["b9_ug"],
  b12_mcg: ["b12_ug"],      // mcg == µg
  iron_mg: ["iron_mg"],
  zinc_mg: ["zinc_mg"],
  copper_mg: ["copper_mg"],
  choline_mg: ["choline_mg"],
  vitamin_c_mg: ["vitamin_c_mg"],
  vitamin_d_ug: ["vitamin_d_ug"], // if you ever pass vitamin_d_mcg, remap in code to _ug
};

/** Some gentle caps for nutrients with zero deficit to avoid overshooting via shortlist (tunable). */
const ZERO_DEFICIT_CAPS: Partial<Record<string, number>> = {
  protein_g: 8, // if protein_g deficit is 0, prefer shortlist items with <= 8 g protein/serving
};

/** Extract base amount & unit from a DB name like "Sardines (1 can, 92 g)", "Flat White (240 mL)". */
function extractBaseAmount(name: string): { amount: number; unit: "g" | "ml" | null } {
  const g = name.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/i);
  if (g) return { amount: Number(g[1]), unit: "g" };
  const ml = name.match(/(\d+(?:\.\d+)?)\s*(?:ml|mL|milliliters?)\b/i);
  if (ml) return { amount: Number(ml[1]), unit: "ml" };
  const cup = name.match(/(\d+(?:\.\d+)?)\s*(?:cup|cups)\b/i);
  if (cup) return { amount: Number(cup[1]) * 240, unit: "ml" }; // approx 240 mL per cup
  const oz = name.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b/i);
  if (oz) return { amount: Number(oz[1]) * 28.35, unit: "g" }; // 1 oz ~ 28.35 g
  return { amount: 0, unit: null };
}

function num(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

type FoodRow = {
  name: string;
  h2o_ml?: number;
  na_mg?: number;
  k_mg?: number;
  mg_mg?: number;
  calcium_mg?: number;
  soluble_fiber_g?: number;
  insoluble_fiber_g?: number;
  protein_g?: number;
  probiotic_cfu?: number;
  omega3_mg?: number;
  polyphenols_mg?: number;
  caffeine_mg?: number;
  b6_mg?: number;
  b9_ug?: number;
  b12_ug?: number;
  iron_mg?: number;
  zinc_mg?: number;
  copper_mg?: number;
  choline_mg?: number;
  vitamin_c_mg?: number;
  vitamin_d_ug?: number;
  // ... any other columns you keep
};

type MealItem = { name: string; grams?: number; ml?: number; source?: "shortlist" | "wild_card" };

type MealPlanFromGPT = {
  meals: { name: string; items: MealItem[]; explanation: string; wild_card?: boolean }[];
  snacks: { name: string; items: MealItem[]; explanation: string }[];
  summary?: string;
};

type Totals = Record<string, number>;

/** Sum contributions from a DB row into totals using a scaling factor (grams or mL). */
function addRowToTotals(totals: Totals, row: FoodRow, factor: number, deficitKeys: string[]) {
  for (const key of deficitKeys) {
    const cols = DEFICIT_TO_COLUMNS[key];
    if (!cols) continue;

    if (key === "fiber_g") {
      const soluble = num(row.soluble_fiber_g) * factor;
      const insoluble = num(row.insoluble_fiber_g) * factor;
      totals.fiber_g = (totals.fiber_g || 0) + soluble + insoluble;
      continue;
    }

    // b12: DB is µg, deficit key is mcg; adding is consistent
    const col = cols[0]!;
    const val = num((row as any)[col]) * factor;
    totals[key] = (totals[key] || 0) + val;
  }
}

/** Find a row by name (exact, then includes). */
function findRowByName(rows: FoodRow[], name: string): FoodRow | undefined {
  const n = name.trim().toLowerCase();
  let row = rows.find(r => r.name?.toLowerCase() === n);
  if (row) return row;
  row = rows.find(r => r.name?.toLowerCase().includes(n));
  return row;
}

/** Compute per-meal totals, with fallback estimation for items not in shortlist (e.g., wild-card). */
async function computeMealTotals(
  mealItems: MealItem[],
  shortlist: FoodRow[],
  deficitKeys: string[]
): Promise<{ totals: Totals; missing: { name: string; grams?: number; ml?: number }[] }> {
  const totals: Totals = {};
  const missing: { name: string; grams?: number; ml?: number }[] = [];

  for (const it of mealItems) {
    const row = findRowByName(shortlist, it.name);
    if (!row) {
      // Will estimate later
      missing.push({ name: it.name, grams: it.grams, ml: it.ml });
      continue;
    }

    // Determine factor: if grams/ml provided, scale relative to base printed in row name (if any).
    let factor = 1;
    const base = extractBaseAmount(row.name);
    if (it.grams != null && base.unit === "g" && base.amount > 0) {
      factor = it.grams / base.amount;
    } else if (it.ml != null && base.unit === "ml" && base.amount > 0) {
      factor = it.ml / base.amount;
    } else {
      // no scaling info; treat given portion as 1 serving if no quantities given
      factor = 1;
    }

    addRowToTotals(totals, row, factor, deficitKeys);
  }

  return { totals, missing };
}

/** Estimate nutrients via GPT for any items not found in DB shortlist. */
async function estimateMissingViaGPT(
  items: { name: string; grams?: number; ml?: number }[],
  deficitKeys: string[]
): Promise<Totals> {
  if (!items.length || !deficitKeys.length) return {};

  // Ask for only the active deficit keys; whole numbers to keep it clean.
  const nutrientFields = deficitKeys.map(k => `"${k}": number` ).join(", ");
  const sys = `Estimate nutrients ONLY for the listed items and ONLY for these keys:
${deficitKeys.join(", ")}.
Units: water_ml (mL), *_mg (mg), b9_ug/b12_mcg/vitamin_d_ug (µg), fiber_g/protein_g (g), probiotic_cfu (count).
Return integers only. Return JSON:
{"items":[{"name":string,${nutrientFields} }]}`;
  const usr = `Items:\n${items
    .map(i => `- ${i.name}${i.grams ? ` , ${i.grams} g` : ""}${i.ml ? ` , ${i.ml} mL` : ""}` )
    .join("\n")}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
  });

  const parsed = JSON.parse(resp.choices[0].message?.content || "{}");
  const estItems: any[] = parsed.items || [];
  const totals: Totals = {};
  for (const k of deficitKeys) totals[k] = 0;

  for (const it of estItems) {
    for (const k of deficitKeys) {
      totals[k] += num(it[k]);
    }
  }
  return totals;
}

/** Sum totals across a list. */
function sumTotals(into: Totals, add: Totals) {
  for (const [k, v] of Object.entries(add)) {
    into[k] = (into[k] || 0) + num(v);
  }
}

/** Round totals to integers. */
function roundTotals(t: Totals) {
  for (const k of Object.keys(t)) t[k] = Math.round(num(t[k]));
}

// ───────────────────────────────────────────────────────────────────────────────
// Main handler
// ───────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      deficits,
      allergies = [] as string[],
      previousMeals = [] as string[],
      includeSnacks = true,
      days_requested = 1, // reserved for future iteration
    } = body;

    if (!deficits || typeof deficits !== "object") {
      return NextResponse.json({
        meals: [],
        snacks: [],
        summary: "No nutrient deficits provided.",
      });
    }

    // 0) Prepare active deficits (largest → smallest), ignore zeros.
    const activeDeficits = Object.entries(deficits)
      .filter(([_, v]) => num(v) > 0)
      .sort((a, b) => num(b[1]) - num(a[1]));
    const activeKeys = activeDeficits.map(([k]) => k);

    // If nothing to optimize, return empty plan.
    if (!activeKeys.length) {
      return NextResponse.json({
        meals: [],
        snacks: [],
        total_from_meals: {},
        summary: "All deficits are zero.",
      });
    }

    // 1) GPT defines the search plan (which nutrients to fetch top foods for).
    //    We still map deficit keys to DB columns in code (don't rely on GPT for column names).
    const planSys = `
Given a deficits object, pick the most important nutrients (largest gaps) and
return a JSON plan of what to fetch from the database: up to 5 foods per nutrient.
Only include nutrients that have a positive deficit. Prefer at most 6 nutrients total.
Return: {"queries":[{"nutrient":"<deficit_key>", "top":5}]}
`;
    const planResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: planSys },
        { role: "user", content: JSON.stringify(deficits) },
      ],
    });

    const plan = JSON.parse(planResp.choices[0].message?.content || "{}");
    let queries: { nutrient: string; top: number }[] = Array.isArray(plan?.queries) ? plan.queries : [];

    // Guardrail: if GPT returned nothing, fall back to top N of active deficits.
    if (!queries.length) {
      const FALLBACK_TOP = 5;
      const MAX_NUTS = Math.min(6, activeKeys.length);
      queries = activeKeys.slice(0, MAX_NUTS).map((k) => ({ nutrient: k, top: FALLBACK_TOP }));
    }

    // 2) Run Supabase queries per selected nutrient.
    const supabase = await createClient();
    let candidateFoods: FoodRow[] = [];

    for (const q of queries) {
      const cols = DEFICIT_TO_COLUMNS[q.nutrient];
      if (!cols || !cols.length) continue;

      // Special-case fiber: we pull top by soluble & insoluble separately, then merge.
      if (q.nutrient === "fiber_g") {
        const pulls = ["soluble_fiber_g", "insoluble_fiber_g"] as const;
        for (const col of pulls) {
          const { data, error } = await supabase
            .from("hydration_options")
            .select(
              `
              name, h2o_ml, na_mg, k_mg, mg_mg, calcium_mg,
              soluble_fiber_g, insoluble_fiber_g, protein_g,
              probiotic_cfu, omega3_mg, polyphenols_mg, caffeine_mg,
              b6_mg, b9_ug, b12_ug, iron_mg, zinc_mg, copper_mg,
              choline_mg, vitamin_c_mg, vitamin_d_ug
              `
            )
            .order(col, { ascending: false })
            .limit(q.top);
          if (!error && data) candidateFoods.push(...(data as FoodRow[]));
        }
        continue;
      }

      // Normal case: order by the mapped single column.
      const orderBy = cols[0]!;
      const { data, error } = await supabase
        .from("hydration_options")
        .select(
          `
          name, h2o_ml, na_mg, k_mg, mg_mg, calcium_mg,
          soluble_fiber_g, insoluble_fiber_g, protein_g,
          probiotic_cfu, omega3_mg, polyphenols_mg, caffeine_mg,
          b6_mg, b9_ug, b12_ug, iron_mg, zinc_mg, copper_mg,
          choline_mg, vitamin_c_mg, vitamin_d_ug
          `
        )
        .order(orderBy, { ascending: false })
        .limit(q.top);

      if (error) {
        console.error("Supabase query error:", error);
        continue;
      }
      if (data) candidateFoods.push(...(data as FoodRow[]));
    }

    // Deduplicate by name
    const dedupByName = Object.values(
      candidateFoods.reduce((acc: Record<string, FoodRow>, f) => {
        if (!acc[f.name]) acc[f.name] = f;
        return acc;
      }, {})
    ) as FoodRow[];

    // Remove allergens (simple name contains check)
    let shortlist = dedupByName.filter((f) =>
      !allergies.some((a: any) => f.name?.toLowerCase().includes(String(a).toLowerCase()))
    );

    // If a nutrient has zero deficit, gently avoid shortlist items that are extreme in that nutrient.
    for (const [nutrient, cap] of Object.entries(ZERO_DEFICIT_CAPS)) {
      if (num(deficits[nutrient]) === 0 && cap != null) {
        const col = DEFICIT_TO_COLUMNS[nutrient]?.[0];
        if (col) {
          shortlist = shortlist.filter((f: any) => num(f[col]) <= cap);
        }
      }
    }

    // 3) GPT assembles meals/snacks from shortlist.
    //    Keep creative variety: include exactly ONE wild-card meal that may use foods outside shortlist.
    const cuisineHints =
      "Mix cuisines (e.g., Asian, Mediterranean, Mexican). Include seasonal or trendy options (bowls, toasts, smoothie bowls).";
    const avoidList = previousMeals?.length ? previousMeals.join(", ") : "none";
    const biggestFirst = activeDeficits.map(([k, v]) => `${k}: ${Math.round(num(v))}` ).join(", ");

    const composeSys = `
You are a clinical nutrition planner.

Goal:
- Design exactly 2 meals and ${includeSnacks ? "1 snack" : "0 snacks"} that cover ~50% of today's deficits.
- Prioritise the biggest gaps first (see order below).
- STRICT: Use only foods from the provided shortlist, EXCEPT exactly ONE meal marked "wild_card": true which may use any foods.
- Avoid allergens. Avoid repeating foods from previous meals.
- Keep ${cuisineHints}
- If some nutrients are zero-deficit (e.g., protein_g=0), do NOT deliberately add foods for those nutrients.

Quantities:
- For each item, provide grams or mL. Keep portions realistic.

Output JSON ONLY:
{
  "meals": [
    { "name": string, "items": [ { "name": string, "grams": number } | { "name": string, "ml": number } ], "explanation": string, "wild_card": boolean }
  ],
  "snacks": [
    { "name": string, "items": [ { "name": string, "grams": number } | { "name": string, "ml": number } ], "explanation": string }
  ],
  "summary": string
}
Explanations must explicitly mention which TOP deficits (largest first) the foods address.
`;

    const shortlistForLLM = shortlist.map((f) => ({
      name: f.name,
      h2o_ml: num((f as any).h2o_ml),
      na_mg: num((f as any).na_mg),
      k_mg: num((f as any).k_mg),
      mg_mg: num((f as any).mg_mg),
      calcium_mg: num((f as any).calcium_mg),
      soluble_fiber_g: num((f as any).soluble_fiber_g),
      insoluble_fiber_g: num((f as any).insoluble_fiber_g),
      protein_g: num((f as any).protein_g),
      probiotic_cfu: num((f as any).probiotic_cfu),
      omega3_mg: num((f as any).omega3_mg),
      polyphenols_mg: num((f as any).polyphenols_mg),
      caffeine_mg: num((f as any).caffeine_mg),
      b6_mg: num((f as any).b6_mg),
      b9_ug: num((f as any).b9_ug),
      b12_ug: num((f as any).b12_ug),
      iron_mg: num((f as any).iron_mg),
      zinc_mg: num((f as any).zinc_mg),
      copper_mg: num((f as any).copper_mg),
      choline_mg: num((f as any).choline_mg),
      vitamin_c_mg: num((f as any).vitamin_c_mg),
      vitamin_d_ug: num((f as any).vitamin_d_ug),
    }));

    const composeUser = JSON.stringify({
      deficits,
      active_deficits_ordered: biggestFirst,
      previousMeals: avoidList,
      shortlist: shortlistForLLM,
      includeSnacks,
    });

    const composeResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: composeSys },
        { role: "user", content: composeUser },
      ],
    });

    const planOut = JSON.parse(composeResp.choices[0].message?.content || "{}") as MealPlanFromGPT;

    // 4) Compute per-meal & per-snack nutrients in code from DB shortlist, with GPT fallback for wild-card items.
    const deficitKeys = activeKeys.slice(); // only compute what's relevant
    const results = { meals: [] as any[], snacks: [] as any[] };
    const totalFromMeals: Totals = {};

    // Meals
    for (const m of planOut.meals || []) {
      const { totals: knownTotals, missing } = await computeMealTotals(m.items || [], shortlist, deficitKeys);
      let wildTotals: Totals = {};

      if (missing.length) {
        wildTotals = await estimateMissingViaGPT(missing, deficitKeys);
      }

      const mealTotals: Totals = {};
      sumTotals(mealTotals, knownTotals);
      sumTotals(mealTotals, wildTotals);
      roundTotals(mealTotals);
      sumTotals(totalFromMeals, mealTotals);

      results.meals.push({
        name: m.name,
        items: m.items,
        nutrients: mealTotals,
        explanation: m.explanation,
        wild_card: !!m.wild_card,
      });
    }

    // Snacks
    if (includeSnacks) {
      for (const s of planOut.snacks || []) {
        const { totals: knownTotals, missing } = await computeMealTotals(s.items || [], shortlist, deficitKeys);
        let wildTotals: Totals = {};
        if (missing.length) wildTotals = await estimateMissingViaGPT(missing, deficitKeys);

        const snackTotals: Totals = {};
        sumTotals(snackTotals, knownTotals);
        sumTotals(snackTotals, wildTotals);
        roundTotals(snackTotals);
        sumTotals(totalFromMeals, snackTotals);

        results.snacks.push({
          name: s.name,
          items: s.items,
          nutrients: snackTotals,
          explanation: s.explanation,
        });
      }
    }

    roundTotals(totalFromMeals);

    // 5) Return
    return NextResponse.json({
      meals: results.meals,
      snacks: results.snacks,
      total_from_meals: totalFromMeals,
      summary: planOut.summary || "",
      shortlist: shortlistForLLM,
      queries, // what GPT asked us to fetch
    });
  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    return NextResponse.json(
      {
        meals: [],
        snacks: [],
        summary: "Meal generation failed.",
      },
      { status: 500 }
    );
  }
}