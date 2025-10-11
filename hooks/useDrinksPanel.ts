import { useState, useCallback, useEffect } from 'react'
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
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
  
  const refreshFromDexie = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])
  
  // Load drink logs from Dexie on mount and when refreshTrigger changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadDrinkLogs = async () => {
      try {
        const { db } = await import('@/lib/dexie-db')
        
        // Get today's drink logs (24 hours)
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
        const logs = await db.drink_logs
          .where('timestamp')
          .above(twentyFourHoursAgo)
          .toArray()
        
        // Calculate total intake from logs
        const calculated: NutritionalIntake = {
          water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
          soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
          iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
          vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
          omega3: 0, polyphenols: 0
        }
        
        logs.forEach(log => {
          if (log.nutrients) {
            Object.entries(log.nutrients).forEach(([key, value]) => {
              if (key in calculated && typeof value === 'number') {
                calculated[key as keyof NutritionalIntake] += value * (log.quantity || 1)
              }
            })
          }
        })
        
        setTotalIntake(calculated)
        console.log('✅ Loaded drink intake from Dexie:', calculated)
      } catch (err) {
        console.warn('Failed to load drink logs from Dexie:', err)
      }
    }
    
    loadDrinkLogs()
  }, [refreshTrigger])
  
  return {
    // State
    drinkSearch, setDrinkSearch,
    drinkSortBy, setDrinkSortBy,
    availableDrinks, setAvailableDrinks,
    totalIntake,
    
    // Actions
    addDrink,
    resetIntake,
    refreshFromDexie
  }
}