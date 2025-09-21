import { NutritionalIntake } from '@/types'

/**
 * Split today's deficits into drink-side and meal-side payloads for the two AI endpoints.
 * - Electrolytes: 35% drinks by default; 60% if heavy sweat (>1.5 L).
 * - Water: 100% drinks.
 * - Threshold-trigger micros for drinks: Mg, B6, Folate (+ drink-side fiber).
 * - Everything else (protein, iron, zinc, B12, choline, omega-3, etc.) goes to meals.
 *
 * NOTE: Keep floats. Do not round here. Let the AI reason precisely, UI can round later.
 */
export function splitDeficitsForAI(
  deficits: Partial<NutritionalIntake>,
  current: NutritionalIntake,
  opts?: {
    sweatLossL?: number;       // liters of sweat lost today
    caffeineCount?: number;    // total caffeinated drinks today
    daysRequested?: number;    // for forward-looking plans (no history stored)
    allergies?: string[];      // for meals
    previousMeals?: string[];  // for meals (avoid repetition of main protein/starch)
    sessionDrinks?: string[];  // for drinks (avoid repeating in-session)
  }
) {
  const {
    sweatLossL = 0,
    caffeineCount = 0,
    daysRequested = 1,
    allergies = [],
    previousMeals = [],
    sessionDrinks = [],
  } = opts || {};

  const heavySweat = sweatLossL > 1.5;
  const electrolyteDrinkRatio = heavySweat ? 0.60 : 0.35; // drinks share
  const electrolyteMealRatio  = 1 - electrolyteDrinkRatio;

  // Helper to safely get numbers
  const num = (v: any) => (v == null ? 0 : typeof v === "number" ? v : Number(v) || 0);

  // ---- Drink-side payload (canonical field names) ----
  const drinksPayload = {
    deficits: {
      // volume is 100% on drinks
      water_ml: num(deficits.water || 0),

      // electrolytes: drink-share only
      sodium_mg: num(deficits.sodium || 0) * electrolyteDrinkRatio,
      potassium_mg: num(deficits.potassium || 0) * electrolyteDrinkRatio,

      // threshold-trigger micros for drinks: use remaining-to-RDA, then give ~50% to drinks
      magnesium_mg: Math.max(0, 250 - num(current.magnesium || 0)) * 0.5,
      b6_mg: Math.max(0, 1.3 - num(current.b6 || 0)) * 0.5,
      b9_folate_mcg: Math.max(0, 400 - num(current.b9 || 0)) * 0.5,

      // drink-side fiber share
      soluble_fiber_g: num(deficits.fiber || 0) * 0.5,

      // drink-side polyphenols share (lets kombucha logic fire if low)
      polyphenols_mg: num(deficits.polyphenols || 0) * 0.5,

      // context
      caffeine_count: caffeineCount,
      sweat_flag: heavySweat,
    },
    sessionDrinks,
    days_requested: daysRequested,
  };

  // ---- Meal-side payload (canonical field names) ----
  const mealsPayload = {
    deficits: {
      // no water in meals
      water_ml: 0,

      // electrolytes: meal-share
      sodium_mg: num(deficits.sodium || 0) * electrolyteMealRatio,
      potassium_mg: num(deficits.potassium || 0) * electrolyteMealRatio,

      // protein: 100% to meals
      protein_g: num(deficits.protein || 0),

      // remaining fiber share to meals
      fiber_g: num(deficits.fiber || 0) * 0.5,

      // micros typically met by food (100% of remaining deficit)
      iron_mg: Math.max(0, num(deficits.iron || 0)),
      zinc_mg: Math.max(0, num(deficits.zinc || 0)),
      b12_mcg: Math.max(0, 2.4 - num(current.b12 || 0)),
      vitamin_c_mg: Math.max(0, 90 - num(current.vitamin_c || 0)),

      // extras primarily food-side
      choline_mg: Math.max(0, 550 - num(current.choline || 0)),
      copper_mg: Math.max(0, 0.9 - num(current.copper || 0)),
      calcium_mg: Math.max(0, 1000 - num(current.calcium || 0)),
      omega3_mg: Math.max(0, 250 - num(current.omega3 || 0)),

      // pass current probiotic status (0 triggers kefir/kraut)
      probiotic_cfu: num(current.probiotic_cfu || 0),
      
      // remaining polyphenols for food
      polyphenols_mg: num(deficits.polyphenols || 0) * 0.5,
    },
    allergies,
    previousMeals,
    includeSnacks: true,
    days_requested: daysRequested,
  };

  return { drinksPayload, mealsPayload };
}

// DEPRECATED - Remove these if they exist
// export function splitDeficitsForRecommendations() { ... }
// export function buildDrinkQueryInstructions() { ... }
// export function buildMealQueryInstructions() { ... }