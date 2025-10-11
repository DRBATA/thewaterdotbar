import { useState, useCallback, useMemo, useEffect } from 'react'
import { NutritionalIntake } from '@/types'

export function useMealsPanel() {
  // Meal inputs
  const [breakfast, setBreakfast] = useState('')
  const [lunch, setLunch] = useState('')
  const [dinner, setDinner] = useState('')
  const [snacks, setSnacks] = useState('')
  const [allergies, setAllergies] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Processed meal nutrition
  const [mealNutrition, setMealNutrition] = useState<{
    breakfast: NutritionalIntake | null
    lunch: NutritionalIntake | null
    dinner: NutritionalIntake | null
    snacks: NutritionalIntake | null
  }>({
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: null
  })
  
  // AI processing state - individual for each meal
  const [processingStates, setProcessingStates] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false
  })
  const [showClarification, setShowClarification] = useState(false)
  const [clarificationData, setClarificationData] = useState<{
    question: string
    suggestions: string[]
    originalInput: string
  } | null>(null)
  
  // Process meal with AI
  const processMealWithAI = useCallback(async (meal: string, mealType: keyof typeof mealNutrition) => {
    if (!meal.trim()) {
      setMealNutrition(prev => ({ ...prev, [mealType]: null }))
      return
    }
    
    setProcessingStates(prev => ({ ...prev, [mealType]: true }))
    try {
      const response = await fetch('/api/ai/parse-meal-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal, mealType })
      })
      
      const data = await response.json()
      
      if (data.needsClarification) {
        setClarificationData({
          question: data.question,
          suggestions: data.suggestions,
          originalInput: meal
        })
        setShowClarification(true)
        return
      }
      
      // Store the parsed nutrition data
      setMealNutrition(prev => ({ ...prev, [mealType]: data.nutrition }))
      
    } catch (error) {
      console.error('Error processing meal:', error)
    } finally {
      setProcessingStates(prev => ({ ...prev, [mealType]: false }))
    }
  }, [])
  
 // Get total meal intake (ALL nutrients)
const totalMealIntake = useMemo(() => {
  const meals = [mealNutrition.breakfast, mealNutrition.lunch, mealNutrition.dinner, mealNutrition.snacks]
  const totals: Partial<NutritionalIntake> = {}
  
  // Sum ALL nutrients from all meals
  meals.forEach(meal => {
    if (meal) {
      Object.entries(meal).forEach(([nutrient, value]) => {
        totals[nutrient as keyof NutritionalIntake] = 
          (totals[nutrient as keyof NutritionalIntake] || 0) + (value || 0)
      })
    }
  })
  
  return totals as NutritionalIntake
}, [mealNutrition])
  
  // Load meals and allergies from Dexie on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadMeals = async () => {
      try {
        const { db, assessmentHelpers } = await import('@/lib/dexie-db')
        
        // 1. Load allergies from user profile (persistent)
        const profile = await db.user_profile.get(1)
        if (profile?.allergies) {
          console.log('✅ Loading allergies from Dexie:', profile.allergies)
          setAllergies(profile.allergies)
        }
        
        // 2. Load meal inputs from current assessment (24h persistent)
        const assessment = await assessmentHelpers.getCurrentAssessment()
        if (assessment?.meals) {
          console.log('✅ Loading meals from Dexie assessment')
          setBreakfast(assessment.meals.breakfast || '')
          setLunch(assessment.meals.lunch || '')
          setDinner(assessment.meals.dinner || '')
          setSnacks(assessment.meals.snacks || '')
          // Note: mealNutrition will be re-parsed when meal inputs change
        }
        
        setIsLoaded(true)
      } catch (err) {
        console.warn('Failed to load meals:', err)
        setIsLoaded(true)
      }
    }
    
    loadMeals()
  }, [])
  
  // Auto-save allergies to sessionStorage and Dexie (only after initial load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return
    
    // Save to sessionStorage
    sessionStorage.setItem('hydrationAllergies', allergies)
    console.log('💾 Allergies auto-saved to sessionStorage')
    
    // Save to Dexie user_profile
    const saveToDexie = async () => {
      try {
        const { db } = await import('@/lib/dexie-db')
        
        // Update or create profile with allergies
        const existing = await db.user_profile.get(1)
        if (existing) {
          await db.user_profile.update(1, {
            allergies,
            updatedAt: new Date()
          })
          console.log('💾 Allergies auto-saved to Dexie')
        }
      } catch (err) {
        console.warn('Failed to save allergies to Dexie:', err)
      }
    }
    
    if (allergies) saveToDexie()
  }, [isLoaded, allergies])
  
  // Auto-save meal inputs to sessionStorage AND Dexie (only after initial load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return
    
    const mealData = {
      breakfast,
      lunch,
      dinner,
      snacks,
      mealNutrition,
      totalMealIntake
    }
    
    // 1. Always save to sessionStorage for quick access
    sessionStorage.setItem('hydrationMeals', JSON.stringify(mealData))
    console.log('💾 Meals auto-saved to sessionStorage')
    
    // 2. Also save to Dexie assessment if one exists (for 24h persistence)
    const saveToDexie = async () => {
      try {
        const { db, assessmentHelpers } = await import('@/lib/dexie-db')
        const assessment = await assessmentHelpers.getCurrentAssessment()
        
        if (assessment) {
          await db.hydration_assessments.update(assessment.id!, {
            meals: {
              breakfast,
              lunch,
              dinner,
              snacks,
              parsed: totalMealIntake
            }
          })
          console.log('💾 Meals also saved to Dexie assessment')
        }
      } catch (err) {
        console.warn('Failed to save meals to Dexie:', err)
      }
    }
    
    saveToDexie()
  }, [isLoaded, breakfast, lunch, dinner, snacks, mealNutrition, totalMealIntake])
  
  return {
    // Meal inputs
    breakfast, setBreakfast,
    lunch, setLunch,
    dinner, setDinner,
    snacks, setSnacks,
    allergies, setAllergies,
    
    // Processed nutrition
    mealNutrition,
    totalMealIntake,
    
    // AI state
    processingStates,
    showClarification, setShowClarification,
    clarificationData, setClarificationData,
    
    // Actions
    processMealWithAI
  }
}