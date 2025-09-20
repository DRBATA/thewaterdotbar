import { useMemo } from 'react'
import { useProfilePanel } from './useProfilePanel'
import { useDrinksPanel } from './useDrinksPanel'
import { useMealsPanel } from './useMealsPanel'
import { calculateDeficits, checkVitaminThresholds } from '@/utils/deficitCalculations'

export function useHydration() {
  const profile = useProfilePanel()
  const drinks = useDrinksPanel()
  const meals = useMealsPanel()
  
  // Combine all intake sources
  const totalIntake = useMemo(() => {
    const combined = { ...drinks.totalIntake }
    
    // Add meal nutrients
    Object.entries(meals.totalMealIntake).forEach(([key, value]) => {
      if (key in combined) {
        combined[key as keyof typeof combined] += value || 0
      }
    })
    
    return combined
  }, [drinks.totalIntake, meals.totalMealIntake])
  
  // Calculate what's still needed
  const deficits = useMemo(() => 
    calculateDeficits(profile.targets, totalIntake),
    [profile.targets, totalIntake]
  )
  
  // Check vitamin thresholds for product recommendations
  const vitaminStatus = useMemo(() => 
    checkVitaminThresholds(totalIntake),
    [totalIntake]
  )
  
  return {
    // Panel hooks
    profile,
    drinks,
    meals,
    
    // Combined data
    totalIntake,
    deficits,
    vitaminStatus
  }
}