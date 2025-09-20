// AI recommendations and outputs
import { NutritionalIntake } from './nutrients'

export interface RecommendedProduct {
    id: string
    name: string
    quantity: number
    water?: number
    sodium?: number
    potassium?: number
    fiber?: number
    protein?: number
    category: string
    price_aed: number
  }
  
  export interface MealSuggestion {
    name: string
    nutrients: Partial<NutritionalIntake>
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    explanation?: string
  }