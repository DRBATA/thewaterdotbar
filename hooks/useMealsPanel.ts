import { useState, useCallback } from 'react'
import { NutritionalIntake } from '@/types'
import { combineMealIntakes, fillMissingNutrients } from '@/utils/mealProcessing'

export function useMealsPanel() {
  // Meal inputs
  const [breakfast, setBreakfast] = useState('')
  const [lunch, setLunch] = useState('')
  const [dinner, setDinner] = useState('')
  const [snacks, setSnacks] = useState('')
  
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
      
      // Fill missing nutrients with smart defaults
      const completeNutrients = fillMissingNutrients(meal, data)
      setMealNutrition(prev => ({ ...prev, [mealType]: completeNutrients }))
      
    } catch (error) {
      console.error('Error processing meal:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  // Get total meal intake
  const totalMealIntake = combineMealIntakes(mealNutrition)
  
  return {
    // Meal inputs
    breakfast, setBreakfast,
    lunch, setLunch,
    dinner, setDinner,
    snacks, setSnacks,
    
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