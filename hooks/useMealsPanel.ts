import { useState, useCallback } from 'react'
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
  
  // AI processing state
  const [isProcessing, setIsProcessing] = useState(false)
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
    
    setIsProcessing(true)
    try {
      const response = await fetch('/api/ai/parse-meal', {
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
      setMealNutrition(prev => ({ ...prev, [mealType]: data }))
      
    } catch (error) {
      console.error('Error processing meal:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  // Get total meal intake (simple combination)
  const totalMealIntake = {
    water: (mealNutrition.breakfast?.water || 0) + (mealNutrition.lunch?.water || 0) + (mealNutrition.dinner?.water || 0) + (mealNutrition.snacks?.water || 0),
    sodium: (mealNutrition.breakfast?.sodium || 0) + (mealNutrition.lunch?.sodium || 0) + (mealNutrition.dinner?.sodium || 0) + (mealNutrition.snacks?.sodium || 0),
    potassium: (mealNutrition.breakfast?.potassium || 0) + (mealNutrition.lunch?.potassium || 0) + (mealNutrition.dinner?.potassium || 0) + (mealNutrition.snacks?.potassium || 0),
    protein: (mealNutrition.breakfast?.protein || 0) + (mealNutrition.lunch?.protein || 0) + (mealNutrition.dinner?.protein || 0) + (mealNutrition.snacks?.protein || 0),
    fiber: (mealNutrition.breakfast?.fiber || 0) + (mealNutrition.lunch?.fiber || 0) + (mealNutrition.dinner?.fiber || 0) + (mealNutrition.snacks?.fiber || 0),
  }
  
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
    isProcessing,
    showClarification, setShowClarification,
    clarificationData, setClarificationData,
    
    // Actions
    processMealWithAI
  }
}