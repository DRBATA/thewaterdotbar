import { NutritionalIntake } from '@/types'

// Split deficits between drinks and meals for AI recommendations
// UPDATED: 35% drinks / 65% food for electrolytes (except heavy sweat loss)
export function splitDeficitsForRecommendations(
  deficits: Partial<NutritionalIntake>,
  currentIntake: NutritionalIntake,
  previousMeals: string[] = [],
  sessionDrinks: string[] = [],
  sweatLoss: number = 0  // L of sweat lost
) {
  // Determine split ratio based on activity
  const isHeavySweating = sweatLoss > 1.5  // More than 1.5L sweat = need more drink-based electrolytes
  const electrolyteRatio = isHeavySweating ? 0.6 : 0.35  // 60% drinks if heavy sweating, else 35%
  
  // DRINKS AI gets: water (100%) + electrolytes (35-60%) + threshold nutrients (50%)
  const drinksTarget = {
    // Water deficit - 100% to drinks (products.water_content_ml or hydration_options.h2o_ml)
    water: deficits.water || 0,  // This maps to h2o_ml in hydration_options
    
    // Electrolytes - 35% normally, 60% if heavy sweating
    sodium: Math.round((deficits.sodium || 0) * electrolyteRatio),  // Maps to na_mg
    potassium: Math.round((deficits.potassium || 0) * electrolyteRatio),  // Maps to k_mg
    
    // Threshold-based nutrients - 50% to drinks via supplements
    fiber: Math.round((deficits.fiber || 0) * 0.5),  // soluble_fiber_g + insoluble_fiber_g
    b6: Math.round(Math.max(0, 1.3 - currentIntake.b6) * 0.5),  // b6_mg
    b9: Math.round(Math.max(0, 400 - currentIntake.b9) * 0.5),  // b9_ug
    b12: Math.round(Math.max(0, 2.4 - currentIntake.b12) * 0.5),  // b12_ug
    iron: Math.round(Math.max(0, 8 - currentIntake.iron) * 0.5),  // iron_mg
    zinc: Math.round(Math.max(0, 11 - currentIntake.zinc) * 0.5),  // zinc_mg
    vitamin_c: Math.round(Math.max(0, 90 - currentIntake.vitamin_c) * 0.5),  // vitamin_c_mg
    
    // Product selection criteria for AI
    productFilters: {
      needsHighFiber: currentIntake.fiber < 8,  // Query: (soluble_fiber_g + insoluble_fiber_g) > 3
      needsGreens: hasMultipleVitaminDeficits(currentIntake),  // Query: category = 'micronutrients'
      needsElectrolytes: (deficits.sodium || 0) > 200 || (deficits.potassium || 0) > 300,
      needsProbiotics: currentIntake.probiotic_cfu < 1000000,  // Query: probiotic_cfu > 0
      isHeavySweating,  // Flag for AI to prioritize electrolyte drinks
      timeOfDay: getTimeOfDay()
    },
    
    // Session variety (what they've already had TODAY)
    varietyRules: {
      sessionDrinks,  // Product IDs already consumed
      maxRepeats: 2,  // OK to have same product twice (e.g., water refill)
      preferVariety: sessionDrinks.length > 2
    },
    
    // Important note for AI about sachets
    aiNotes: {
      sachetWater: 'Sachets require 500ml water (not included in sachet price)',
      queryTables: 'Use products table for venue stock, hydration_options for nutritional data',
      waterField: 'Use h2o_ml from hydration_options or water_content_ml from products'
    }
  }
  
  // MEALS AI gets: NO water + electrolytes (65%) + remaining nutrients (50%) + ALL micronutrients
  const mealsTarget = {
    // NO water deficit for meals - we don't try to make up water with food
    water: 0,  // Water comes from drinks only
    
    // Electrolytes - 65% to food (or 40% if heavy sweating)
    sodium: Math.round((deficits.sodium || 0) * (1 - electrolyteRatio)),  // na_mg
    potassium: Math.round((deficits.potassium || 0) * (1 - electrolyteRatio)),  // k_mg
    
    // Protein - 100% to meals
    protein: deficits.protein || 0,  // protein_g
    
    // Remaining nutrients - 50% to meals
    fiber: Math.round((deficits.fiber || 0) * 0.5),
    b6: Math.round(Math.max(0, 1.3 - currentIntake.b6) * 0.5),
    b9: Math.round(Math.max(0, 400 - currentIntake.b9) * 0.5),
    b12: Math.round(Math.max(0, 2.4 - currentIntake.b12) * 0.5),
    iron: Math.round(Math.max(0, 8 - currentIntake.iron) * 0.5),
    zinc: Math.round(Math.max(0, 11 - currentIntake.zinc) * 0.5),
    vitamin_c: Math.round(Math.max(0, 90 - currentIntake.vitamin_c) * 0.5),
    
    // Additional micronutrients only tracked in hydration_options
    choline: Math.max(0, 550 - (currentIntake.choline || 0)),  // choline_mg
    copper: Math.max(0, 0.9 - (currentIntake.copper || 0)),  // copper_mg
    calcium: Math.max(0, 1000 - (currentIntake.calcium || 0)),  // calcium_mg
    omega3: Math.max(0, 250 - (currentIntake.omega3 || 0)),  // omega3_mg
    
    // Query filters for AI
    productFilters: {
      needsPotassiumBoost: (deficits.potassium || 0) > 500,
      needsIronBoost: (deficits.iron || 0) > 4,
      needsProteinBoost: (deficits.protein || 0) > 20,
      needsProbiotics: currentIntake.probiotic_cfu < 1000000,  // Will favor kefir/yogurt
      needsCholine: (currentIntake.choline || 0) < 275,  // 50% RDA
      needsCopper: (currentIntake.copper || 0) < 0.45,  // 50% RDA
    },
    
    // Meal variety
    varietyRules: {
      previousMeals,
      avoidDuplicates: true,
      includeSnacks: true,
      // To avoid always recommending kefir for probiotics
      balanceRecommendations: 'If probiotics needed, alternate between kefir, yogurt, kimchi, sauerkraut'
    },
    
    // Query guidance
    aiNotes: {
      queryTable: 'hydration_options',
      includeAllNutrients: true,
      priorityOrder: 'protein > electrolytes > fiber > probiotics > micronutrients'
    }
  }
  
  return { drinksTarget, mealsTarget }
}

// Helper function to check for multiple vitamin deficiencies
function hasMultipleVitaminDeficits(intake: NutritionalIntake): boolean {
  const rdaThresholds = {
    b6: 1.3,  // mg
    b9: 400,  // ug
    b12: 2.4,  // ug
    vitamin_c: 90,  // mg
    iron: 8,  // mg
    zinc: 11,  // mg
    vitamin_d: 15  // ug
  }
  
  const deficientVitamins = Object.entries(rdaThresholds)
    .filter(([vitamin, rda]) => (intake[vitamin as keyof NutritionalIntake] || 0) < rda * 0.5)
  
  return deficientVitamins.length >= 2
}

// Helper to get time of day
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

// Build drink-specific query instructions for AI
export function buildDrinkQueryInstructions(drinksTarget: any, venueId: string) {
  return {
    primaryQuery: `
      -- Get products with venue availability
      SELECT 
        p.id,
        p.name,
        p.category,
        p.water_content_ml,  -- Water from products table
        p.sodium_mg,
        p.potassium_mg,
        p.fiber_g,
        p.probiotic_cfu,
        vs.qty_on_hand
      FROM products p
      JOIN venue_stock vs ON p.id = vs.product_id
      WHERE vs.venue_id = $1 AND vs.qty_on_hand > 0
    `,
    
    secondaryQuery: `
      -- Get nutritional details from hydration_options if needed
      SELECT 
        ho.h2o_ml,  -- Water from hydration_options
        ho.na_mg,   -- Sodium
        ho.k_mg,    -- Potassium
        ho.soluble_fiber_g,
        ho.insoluble_fiber_g,
        ho.probiotic_cfu
      FROM hydration_options ho
      WHERE ho.product_id = $product_id
    `,
    
    priorityOrder: [
      'Match water deficit first (h2o_ml or water_content_ml)',
      'Match electrolyte deficits (na_mg/sodium_mg, k_mg/potassium_mg)',
      'Consider heavy sweating flag for electrolyte priority',
      'Match fiber needs if flagged',
      'Provide variety if multiple drinks already consumed'
    ],
    
    specialInstructions: {
      sachets: 'If recommending a sachet, add 500ml water requirement (not in price)',
      waterRefill: 'Water Refill product ID: 3bbce6f4-0ba2-441e-84fb-43802d4136bc',
      heavySweating: drinksTarget.productFilters.isHeavySweating ? 
        'Prioritize high-electrolyte drinks' : 'Balance hydration and nutrients'
    },
    
    venueId,
    deficits: drinksTarget
  }
}

// Build meal-specific query instructions for AI
export function buildMealQueryInstructions(mealsTarget: any) {
  return {
    query: `
      -- Query hydration_options for food items
      SELECT 
        id,
        name,
        category,
        protein_g,
        na_mg,
        k_mg,
        soluble_fiber_g,
        insoluble_fiber_g,
        probiotic_cfu,
        choline_mg,
        copper_mg,
        calcium_mg,
        omega3_mg,
        iron_mg,
        zinc_mg
      FROM hydration_options
      WHERE category IN ('food', 'meal', 'snack')
      AND h2o_ml < 100  -- Exclude drinks (low water content)
    `,
    
    priorityOrder: [
      'Match protein deficit first',
      'Match electrolyte deficits (65% of total)',
      'Include all micronutrients (choline, copper, etc.)',
      'Balance probiotic sources to avoid repetition',
      'Avoid suggesting same meals already eaten'
    ],
    
    varietyStrategy: {
      probiotics: 'Rotate: kefir → yogurt → kimchi → sauerkraut → kombucha',
      highProtein: 'Vary protein sources: animal → plant → dairy',
      avoidMonotony: 'Never suggest same item twice in one session'
    },
    
    deficits: mealsTarget,
    avoidList: mealsTarget.varietyRules.previousMeals,
    
    outputFormat: 'Return meals suitable for image generation'
  }
}