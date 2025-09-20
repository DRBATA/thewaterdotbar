// Body composition and physical data
export interface BodyComposition {
  weight: number
  bodyFat: number
  leanBodyMass: number
  icwLbmRatio: number
  ecwTbwRatio: number
  tbw: number
  icw: number
  ecw: number
  includesWeightTraining: boolean  // NEW: Simple checkbox
}

// User choices for body input
export type Sex = 'male' | 'female'
export type BodyType = 'shredded' | 'fit' | 'average' | 'carrying-extra'
export type ActivityLevel = 'light' | 'moderate' | 'heavy'
