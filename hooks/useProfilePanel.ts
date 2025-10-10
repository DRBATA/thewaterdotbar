import { useState, useMemo, useEffect } from 'react'
import { BodyComposition, Sex, BodyType, ActivityLevel, InputMethod, SweatContext } from '@/types'
import { calculateLBM, getBodyFatFromType, calculateBodyWater } from '@/utils/bodyCalculations'
import { calculateNutrientTargets, calculateSweatLoss } from '@/utils/nutrientCalculations'

export function useProfilePanel() {
  // User inputs
  const [inputMethod, setInputMethod] = useState<InputMethod>('direct')
  const [sex, setSex] = useState<Sex>('male')
  const [bodyType, setBodyType] = useState<BodyType>('average')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [sweatContext, setSweatContext] = useState<SweatContext>('moderate')
  const [sessionHours, setSessionHours] = useState(1)
  const [includesWeightTraining, setIncludesWeightTraining] = useState(false)
  const [weight, setWeight] = useState(70)
  const [manualBodyFat, setManualBodyFat] = useState(15)
  
  // Calculate body composition
  const bodyComposition = useMemo((): BodyComposition => {
    const bodyFat = inputMethod === 'bodytype' 
      ? getBodyFatFromType(bodyType, sex)
      : manualBodyFat
    
    const lbm = calculateLBM(weight, bodyFat)
    const waterData = calculateBodyWater(weight, bodyFat, sex)
    
    return {
      weight,
      bodyFat,
      leanBodyMass: lbm,
      includesWeightTraining,
      ...waterData
    }
  }, [weight, manualBodyFat, bodyType, sex, inputMethod, includesWeightTraining])
  
  // Calculate sweat loss and targets
  const sweatLoss = useMemo(() => 
    calculateSweatLoss(sweatContext, sessionHours), 
    [sweatContext, sessionHours]
  )
  
  const targets = useMemo(() => 
    calculateNutrientTargets(bodyComposition.leanBodyMass, activityLevel, includesWeightTraining, sweatLoss),
    [bodyComposition.leanBodyMass, activityLevel, includesWeightTraining, sweatLoss]
  )
  
  // Auto-save profile to sessionStorage as user types
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const profileData = {
      inputMethod,
      sex,
      bodyType,
      weight,
      bodyFat: bodyComposition.bodyFat, // Use calculated bodyFat
      activityLevel,
      sweatContext,
      sessionHours,
      includesWeightTraining,
      targets,
      sweatLoss
    }
    
    sessionStorage.setItem('hydrationProfile', JSON.stringify(profileData))
    console.log('💾 Profile auto-saved to sessionStorage')
    
  }, [inputMethod, sex, bodyType, weight, bodyComposition.bodyFat, activityLevel, sweatContext, sessionHours, includesWeightTraining, targets, sweatLoss])
  
  // Auto-save profile to Dexie user_profile (persistent, basic info only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saveToDexie = async () => {
      try {
        const { db } = await import('@/lib/dexie-db')
        
        // Save to user_profile table (persistent, survives browser close)
        await db.user_profile.put({
          id: 1, // Single profile per device
          weight,
          bodyFat: bodyComposition.bodyFat,
          sex,
          allergies: '', // Will be set by meals panel
          updatedAt: new Date()
        })
        
        console.log('💾 Profile basics auto-saved to Dexie user_profile')
      } catch (err) {
        console.warn('Failed to save profile to Dexie:', err)
      }
    }
    
    saveToDexie()
  }, [weight, bodyComposition.bodyFat, sex])
  
  return {
    // State
    inputMethod, setInputMethod,
    sex, setSex,
    bodyType, setBodyType,
    activityLevel, setActivityLevel,
    sweatContext, setSweatContext,
    sessionHours, setSessionHours,
    weight, setWeight,
    manualBodyFat, setManualBodyFat,
    includesWeightTraining, setIncludesWeightTraining,     
    // Computed
    bodyComposition,
    sweatLoss,
    targets
  }
}