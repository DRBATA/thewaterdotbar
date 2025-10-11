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
  const [isLoaded, setIsLoaded] = useState(false)
  
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
  
  // Load profile from storage on mount (Dexie = source of truth)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadProfile = async () => {
      try {
        // 1. Try Dexie first (persistent across sessions)
        const { db } = await import('@/lib/dexie-db')
        const profile = await db.user_profile.get(1)
        
        if (profile) {
          console.log('✅ Loading profile from Dexie:', profile)
          setWeight(profile.weight)
          setSex(profile.sex)
          
          // Set bodyFat based on input method
          setManualBodyFat(profile.bodyFat)
          setIsLoaded(true)
          return
        }
        
        // 2. Fallback to sessionStorage (within-session only)
        const cached = sessionStorage.getItem('hydrationProfile')
        if (cached) {
          const data = JSON.parse(cached)
          console.log('✅ Loading profile from sessionStorage:', data)
          
          if (data.inputMethod) setInputMethod(data.inputMethod)
          if (data.sex) setSex(data.sex)
          if (data.bodyType) setBodyType(data.bodyType)
          if (data.weight) setWeight(data.weight)
          if (data.bodyFat) setManualBodyFat(data.bodyFat)
          if (data.activityLevel) setActivityLevel(data.activityLevel)
          if (data.sweatContext) setSweatContext(data.sweatContext)
          if (data.sessionHours) setSessionHours(data.sessionHours)
          if (typeof data.includesWeightTraining === 'boolean') {
            setIncludesWeightTraining(data.includesWeightTraining)
          }
        }
        
        setIsLoaded(true)
      } catch (err) {
        console.warn('Failed to load profile:', err)
        setIsLoaded(true)
      }
    }
    
    loadProfile()
  }, [])
  
  // Auto-save profile to sessionStorage as user types (only after initial load)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return
    
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
    
  }, [isLoaded, inputMethod, sex, bodyType, weight, bodyComposition.bodyFat, activityLevel, sweatContext, sessionHours, includesWeightTraining, targets, sweatLoss])
  
  // Auto-save profile to Dexie user_profile (persistent, basic info only)
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return
    
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
  }, [isLoaded, weight, bodyComposition.bodyFat, sex])
  
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