// Nutrient targets (calculated from body composition)
export interface NutrientTargets {
    water: number      // ml (33ml/kg LBM)
    sodium: number     // mg (27mg/kg LBM)
    potassium: number  // mg (42mg/kg LBM)
    protein: number    // g (1.2-1.8g/kg LBM)
    fiber: number      // g (fixed 20g/day)
  }
  
  // Full nutritional intake tracking (based on hydration_options table)
  export interface NutritionalIntake {
    // Core hydration
    water: number
    sodium: number
    potassium: number
    
    // Macros
    protein: number
    fiber: number
    soluble_fiber: number
    insoluble_fiber: number
    
    // Minerals
    magnesium: number
    calcium: number
    iron: number
    zinc: number
    copper: number
    choline: number
    
    // Vitamins
    b6: number
    b9: number
    b12: number
    vitamin_c: number
    vitamin_d: number
    
    // Others
    caffeine: number
    probiotics: number
    omega3: number
    polyphenols: number
    probiotic_cfu?: number 
  }