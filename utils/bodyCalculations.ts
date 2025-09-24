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
  
  // More accurate TBW calculation when body fat is known
  // Uses the fact that lean mass is ~73% water, fat mass is ~10% water
  const fatMass = weight * (bodyFat / 100)
  const tbw = bodyFat > 0 
    ? (lbm * 0.73) + (fatMass * 0.10)  // Precise calculation with body fat
    : (sex === 'male' ? weight * 0.6 : weight * 0.5)  // Fallback estimation
    
  // Water compartments: ICW ≈ 2/3 of TBW, ECW ≈ 1/3 of TBW
  const icw = tbw * (2/3)  // Intracellular water (~66.7% of TBW)
  const ecw = tbw * (1/3)  // Extracellular water (~33.3% of TBW)
  
  return {
    tbw,
    icw,
    ecw,
    icwLbmRatio: icw / lbm,
    ecwTbwRatio: ecw / tbw
  }
}