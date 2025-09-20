import { BodyComposition, Sex, BodyType, ActivityLevel } from '@/types'

// Calculate lean body mass from weight and body fat
export function calculateLBM(weight: number, bodyFat: number): number {
  return weight * (1 - bodyFat / 100)
}

// Get body fat percentage from body type selection
export function getBodyFatFromType(bodyType: BodyType, sex: Sex): number {
  const mapping = {
    male: { 
      shredded: 10, 
      fit: 15, 
      average: 20, 
      'carrying-extra': 25 
    },
    female: { 
      shredded: 18, 
      fit: 22, 
      average: 28, 
      'carrying-extra': 33 
    }
  }
  return mapping[sex][bodyType]
}

// Calculate total body water and compartments
export function calculateBodyWater(weight: number, bodyFat: number, sex: Sex) {
  const lbm = calculateLBM(weight, bodyFat)
  const tbw = sex === 'male' ? weight * 0.6 : weight * 0.5
  const icw = lbm * 0.7  // Intracellular water
  const ecw = tbw - icw  // Extracellular water
  
  return {
    tbw,
    icw,
    ecw,
    icwLbmRatio: icw / lbm,
    ecwTbwRatio: ecw / tbw
  }
}