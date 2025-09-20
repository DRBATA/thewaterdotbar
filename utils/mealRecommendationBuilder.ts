import { NutritionalIntake } from '@/types'

// Build comprehensive meal recommendation request for AI
export function buildMealRecommendationRequest(
  mealsTarget: any,
  previousMeals: string[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' = 'afternoon'
) {
  return {
    // Nutrient targets (50% of deficits)
    nutrients: {
      protein: mealsTarget.protein,
      fiber: mealsTarget.fiber,
      b6: mealsTarget.b6,
      b9: mealsTarget.b9,
      b12: mealsTarget.b12,
      iron: mealsTarget.iron,
      zinc: mealsTarget.zinc,
      vitamin_c: mealsTarget.vitamin_c
    },
    
    // High-impact single items for major deficits
    specialRequests: {
      potassiumBoost: mealsTarget.needsPotassiumBoost ? 
        "Include high-potassium snacks like banana, avocado, or coconut water" : null,
      ironBoost: mealsTarget.needsIronBoost ? 
        "Include iron-rich foods like spinach, red meat, or dark chocolate" : null,
      proteinBoost: mealsTarget.needsProteinBoost ? 
        "Include high-protein snacks like Greek yogurt, nuts, or protein bars" : null
    },
    
    // Variety and preferences
    variety: {
      previousMeals,
      timeOfDay,
      includeSnacks: mealsTarget.includeSnacks,
      maxSuggestions: 3,
      preferWholeFoods: true
    },
    
    // Source specification
    sourceTable: 'hydration_options',
    filterBy: {
      category: ['meal', 'snack', 'supplement'],
      excludeNames: previousMeals
    }
  }
}

// Build drink recommendation request for AI
export function buildDrinkRecommendationRequest(
  drinksTarget: any,
  recentProducts: string[],
  varietyRules: any
) {
  return {
    // Core electrolyte deficits (calculated)
    electrolytes: {
      water: drinksTarget.water,
      sodium: drinksTarget.sodium,
      potassium: drinksTarget.potassium
    },
    
    // Supplement targets (threshold-based)
    supplements: {
      fiber: drinksTarget.fiber,
      b6: drinksTarget.b6,
      b9: drinksTarget.b9,
      b12: drinksTarget.b12,
      iron: drinksTarget.iron,
      zinc: drinksTarget.zinc,
      vitamin_c: drinksTarget.vitamin_c
    },
    
    // Product-specific triggers
    productTriggers: {
      poppi: drinksTarget.needsPoppi,
      riteGreens: drinksTarget.needsGreens,
      caffeine: drinksTarget.needsCaffeine
    },
    
    // Variety and swapping rules
    variety: varietyRules,
    
    // Source specification
    sourceTable: 'products',
    maxRecommendations: 3
  }
}