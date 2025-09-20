import { NutrientTargets, ActivityLevel } from '@/types'

// Calculate the 4 core nutrient targets from LBM
export function calculateNutrientTargets(
  lbm: number, 
  activityLevel: ActivityLevel, 
  includesWeightTraining: boolean,
  sweatLoss: number = 0
): NutrientTargets {
  // Base calculations per kg LBM
  let water = lbm * 33      // 33ml/kg
  let sodium = lbm * 27     // 27mg/kg  
  let potassium = lbm * 42  // 42mg/kg
  let protein = lbm * 1.2   // 1.2g/kg base
  
  // Weight training boost (separate from activity intensity)
  if (includesWeightTraining) {
    protein = lbm * 1.8  // Weight training needs more protein
  }
  
  // Activity intensity affects electrolytes (not protein)
  if (activityLevel === 'moderate' || activityLevel === 'heavy') {
    // Hot yoga/HIIT increases electrolyte needs
    sodium *= 1.3
    potassium *= 1.3
  }
  
  // Add sweat losses
  water += sweatLoss * 1000      // Convert L to ml
  sodium += sweatLoss * 920      // ~920mg/L sweat
  potassium += sweatLoss * 195   // ~195mg/L sweat
  
  return {
    water: Math.round(water),
    sodium: Math.round(sodium),
    potassium: Math.round(potassium),
    protein: Math.round(protein * 10) / 10,
    fiber: 20  // Fixed 20g/day
  }
}

// Calculate sweat loss based on activity context
export function calculateSweatLoss(
  context: 'cool' | 'moderate' | 'hot',
  sessionHours: number
): number {
  const sweatRates = {
    cool: 0.5,     // L/hour
    moderate: 1.0, // L/hour  
    hot: 1.5       // L/hour
  }
  
  return sweatRates[context] * sessionHours
}