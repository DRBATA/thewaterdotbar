import { NutrientTargets, NutritionalIntake } from '@/types'

// Calculate what's still needed (targets - current intake)
export function calculateDeficits(
  targets: NutrientTargets,
  currentIntake: NutritionalIntake
): Partial<NutritionalIntake> {
  return {
    water: Math.max(0, targets.water - currentIntake.water),
    sodium: Math.max(0, targets.sodium - currentIntake.sodium),
    potassium: Math.max(0, targets.potassium - currentIntake.potassium),
    protein: Math.max(0, targets.protein - currentIntake.protein),
    fiber: Math.max(0, targets.fiber - currentIntake.fiber)
  }
}

// Check if vitamin thresholds are met
export function checkVitaminThresholds(intake: NutritionalIntake): {
  needsGreens: boolean
  needsPoppi: boolean
  lowVitamins: string[]
} {
  const rdaThresholds = {
    b6: 1.3,      // mg
    b9: 400,      // mcg
    b12: 2.4,     // mcg
    vitamin_c: 90, // mg
    iron: 8,      // mg
    zinc: 11      // mg
  }
  
  const lowVitamins = Object.entries(rdaThresholds)
    .filter(([vitamin, rda]) => (intake[vitamin as keyof NutritionalIntake] || 0) < rda * 0.5)
    .map(([vitamin]) => vitamin)
  
  return {
    needsGreens: lowVitamins.length > 2, // Multiple vitamin deficiencies
    needsPoppi: intake.fiber < 8,        // Low fiber needs gut health
    lowVitamins
  }
}