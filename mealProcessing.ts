import { NutritionalIntake } from '@/types'

// Combine multiple meal intakes into total
export function combineMealIntakes(meals: {
  breakfast?: NutritionalIntake | null
  lunch?: NutritionalIntake | null  
  dinner?: NutritionalIntake | null
  snacks?: NutritionalIntake | null
}): NutritionalIntake {
  const empty: NutritionalIntake = {
    water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
    soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
    iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
    vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
    omega3: 0, polyphenols: 0
  }
  
  const allMeals = Object.values(meals).filter(Boolean) as NutritionalIntake[]
  
  return allMeals.reduce((total, meal) => {
    Object.keys(total).forEach(key => {
      const nutrient = key as keyof NutritionalIntake
      total[nutrient] += meal[nutrient] || 0
    })
    return total
  }, { ...empty })
}

// Provide fallback nutrients when AI doesn't return complete data
export function fillMissingNutrients(
  mealDescription: string, 
  partialNutrients: Partial<NutritionalIntake>
): NutritionalIntake {
  const defaults: NutritionalIntake = {
    water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
    soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
    iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
    vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
    omega3: 0, polyphenols: 0
  }
  
  // Smart defaults based on meal description
  const meal = mealDescription.toLowerCase()
  
  if (meal.includes('salmon') || meal.includes('fish')) {
    defaults.protein = partialNutrients.protein || 25
    defaults.omega3 = partialNutrients.omega3 || 1200
  }
  
  if (meal.includes('spinach') || meal.includes('kale')) {
    defaults.iron = partialNutrients.iron || 3
    defaults.vitamin_c = partialNutrients.vitamin_c || 30
  }
  
  return { ...defaults, ...partialNutrients }
}