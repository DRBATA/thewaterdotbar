import { useState, useCallback } from 'react'
import { NutritionalIntake } from '@/types'

export function useDrinksPanel() {
  const [drinkSearch, setDrinkSearch] = useState('')
  const [drinkSortBy, setDrinkSortBy] = useState<'name' | 'volume'>('name')
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([])
  const [totalIntake, setTotalIntake] = useState<NutritionalIntake>({
    water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
    soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
    iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
    vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
    omega3: 0, polyphenols: 0
  })
  
  const addDrink = useCallback((drinkNutrients: Partial<NutritionalIntake>) => {
    setTotalIntake(prev => {
      const updated = { ...prev }
      Object.entries(drinkNutrients).forEach(([key, value]) => {
        if (value && key in updated) {
          updated[key as keyof NutritionalIntake] += value
        }
      })
      return updated
    })
  }, [])
  
  const resetIntake = useCallback(() => {
    setTotalIntake({
      water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
      soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
      iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
      vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
      omega3: 0, polyphenols: 0
    })
  }, [])
  
  return {
    // State
    drinkSearch, setDrinkSearch,
    drinkSortBy, setDrinkSortBy,
    availableDrinks, setAvailableDrinks,
    totalIntake,
    
    // Actions
    addDrink,
    resetIntake
  }
}