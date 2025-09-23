import { useState, useMemo } from 'react'
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
  // Direct input values
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