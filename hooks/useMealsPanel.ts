import { useState, useCallback, useMemo } from 'react'
import { NutritionalIntake } from '@/types'

export function useMealsPanel() {
  // Meal inputs
  const [breakfast, setBreakfast] = useState('')
  const [lunch, setLunch] = useState('')
  const [dinner, setDinner] = useState('')
  const [snacks, setSnacks] = useState('')
  const [allergies, setAllergies] = useState('')
  
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