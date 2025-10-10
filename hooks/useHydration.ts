import { useMemo, useEffect } from 'react'
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
  
  // Save FULL hydration assessment to Dexie (24-hour context)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saveFullAssessment = async () => {
      try {
        const { assessmentHelpers } = await import('@/lib/dexie-db')
        
        // Save complete hydration context to hydration_assessments table
        await assessmentHelpers.saveAssessment({
          profile: {
            weight: profile.weight,
            bodyFat: profile.bodyComposition.bodyFat,
            sex: profile.sex,
            allergies: meals.allergies || ''
          },
          activityLevel: profile.activityLevel,
          sweatContext: profile.sweatContext,
          sessionHours: profile.sessionHours,
          targets: profile.targets,
          meals: {
            breakfast: meals.breakfast || '',
            lunch: meals.lunch || '',
            dinner: meals.dinner || '',
            snacks: meals.snacks || '',
            parsed: meals.totalMealIntake
          }
        })
        
        console.log('💾 Full hydration assessment auto-saved to Dexie (24h context)')
      } catch (err) {
        console.warn('Failed to save full assessment to Dexie:', err)
      }
    }
    
    // Only save if we have meaningful data
    if (profile.weight && profile.bodyComposition.bodyFat) {
      saveFullAssessment()
    }
  }, [
    profile.weight,
    profile.bodyComposition.bodyFat,
    profile.sex,
    profile.activityLevel,
    profile.sweatContext,
    profile.sessionHours,
    profile.targets,
    meals.breakfast,
    meals.lunch,
    meals.dinner,
    meals.snacks,
    meals.allergies,
    meals.totalMealIntake
  ])
  
  // Save complete INPUT context to sessionStorage (for cart_headers transfer)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saveInputContext = async () => {
      try {
        // Get drink_logs from Dexie
        const { db } = await import('@/lib/dexie-db')
        const assessment = await db.hydration_assessments
          .orderBy('timestamp')
          .last()
        
        let drinkLogs: any[] = []
        if (assessment?.id) {
          drinkLogs = await db.drink_logs
            .where('assessment_id')
            .equals(assessment.id)
            .toArray()
        }
        
        const inputContext = {
          profile: {
            weight: profile.weight,
            bodyFat: profile.bodyComposition.bodyFat,
            sex: profile.sex,
            allergies: meals.allergies || ''
          },
          activityLevel: profile.activityLevel,
          sweatContext: profile.sweatContext,
          sessionHours: profile.sessionHours,
          targets: profile.targets,
          meals: {
            breakfast: meals.breakfast || '',
            lunch: meals.lunch || '',
            dinner: meals.dinner || '',
            snacks: meals.snacks || '',
            parsed: meals.totalMealIntake
          },
          drink_logs: drinkLogs.map(log => ({
            product_id: log.product_id,
            name: log.name,
            quantity: log.quantity,
            timestamp: log.timestamp
          }))
        }
        
        sessionStorage.setItem('hydrationInputContext', JSON.stringify(inputContext))
        console.log('💾 INPUT context saved to sessionStorage (for cart_headers)')
      } catch (err) {
        console.warn('Failed to save input context:', err)
      }
    }
    
    if (profile.weight && profile.bodyComposition.bodyFat) {
      saveInputContext()
    }
  }, [
    profile.weight,
    profile.bodyComposition.bodyFat,
    profile.sex,
    profile.activityLevel,
    profile.sweatContext,
    profile.sessionHours,
    profile.targets,
    meals.breakfast,
    meals.lunch,
    meals.dinner,
    meals.snacks,
    meals.allergies,
    meals.totalMealIntake,
    drinks.totalIntake // Trigger when drinks change
  ])
  
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