// Simplified hydration and nutrition assessment logic

interface BodyMetrics {
  gender: 'male' | 'female';
  bodyType: 'small' | 'medium' | 'large';
  activityToday: 'none' | 'light' | 'moderate' | 'intense';
}

interface IntakeAssessment {
  waterGlasses: number;
  coffee: boolean;
  tea: boolean;
  alcohol: boolean;
  hadBreakfast: 'none' | 'light' | 'full';
  hadLunch: 'none' | 'light' | 'full';
  fruitsVeggies: number;
  feelingThirsty: boolean;
  feelingTired: boolean;
  darkUrine: boolean;
  headache: boolean;
}

// Product catalog with prices
export const PRODUCTS = {
  // Hydration
  coconutWater500: { 
    name: 'Coconut Water 500ml', 
    price: 4.50,
    hydration: 500,
    electrolytes: true 
  },
  kombucha350: { 
    name: 'Kombucha 350ml', 
    price: 5.50,
    hydration: 350,
    probiotics: true 
  },
  water500: { 
    name: 'Alkaline Water 500ml', 
    price: 2.50,
    hydration: 500 
  },
  
  // Electrolytes
  humantra: { 
    name: 'Humantra Electrolyte Sachet', 
    price: 3.00,
    sodium: 500,
    potassium: 200,
    magnesium: 60 
  },
  
  // Fiber/Gut Health
  riteGutHealth: { 
    name: 'Rite Gut Health Sachet', 
    price: 4.00,
    solubleFireber: 10,
    insolubleFiber: 2 
  },
  
  // Micronutrients
  riteGreens: { 
    name: 'Rite Greens Shot', 
    price: 6.00,
    polyphenols: 500,
    vitamins: true 
  },
  
  // Energy
  coldBrew: { 
    name: 'Cold Brew Coffee 250ml', 
    price: 4.50,
    caffeine: 150 
  },
  matchaLatte: { 
    name: 'Matcha Latte 300ml', 
    price: 5.50,
    caffeine: 70,
    ltheanine: true 
  }
};

export function calculateHydrationNeeds(metrics: BodyMetrics): number {
  // Estimated weights based on body type
  const bodyWeights = {
    'male-small': 65,
    'male-medium': 75,
    'male-large': 90,
    'female-small': 55,
    'female-medium': 65,
    'female-large': 75,
  };
  
  const key = `${metrics.gender}-${metrics.bodyType}` as keyof typeof bodyWeights;
  const estimatedWeight = bodyWeights[key] || 70;
  
  // Base: 33ml per kg
  let dailyWater = estimatedWeight * 33;
  
  // Activity multipliers
  const activityMultipliers = {
    none: 1.0,
    light: 1.2,
    moderate: 1.4,
    intense: 1.6
  };
  
  dailyWater *= activityMultipliers[metrics.activityToday];
  
  return Math.round(dailyWater);
}

export function calculateElectrolyteNeeds(metrics: BodyMetrics) {
  const bodyWeights = {
    'male-small': 65,
    'male-medium': 75,
    'male-large': 90,
    'female-small': 55,
    'female-medium': 65,
    'female-large': 75,
  };
  
  const key = `${metrics.gender}-${metrics.bodyType}` as keyof typeof bodyWeights;
  const estimatedWeight = bodyWeights[key] || 70;
  
  // Simplified LBM estimate (85% for males, 75% for females)
  const lbm = estimatedWeight * (metrics.gender === 'male' ? 0.85 : 0.75);
  
  return {
    sodium: Math.round(lbm * 30), // mg
    potassium: Math.round(lbm * 50), // mg
    magnesium: Math.round(estimatedWeight * 5) // mg
  };
}

export function analyzeGaps(
  metrics: BodyMetrics,
  intake: IntakeAssessment
) {
  const dailyWaterNeed = calculateHydrationNeeds(metrics);
  const electrolyteNeeds = calculateElectrolyteNeeds(metrics);
  
  // Calculate consumed water
  const consumedWater = intake.waterGlasses * 250;
  
  // Add dehydration indicators
  let extraWaterNeeded = 0;
  if (intake.feelingThirsty) extraWaterNeeded += 500;
  if (intake.darkUrine) extraWaterNeeded += 500;
  if (intake.headache) extraWaterNeeded += 300;
  if (intake.alcohol) extraWaterNeeded += 500;
  
  const waterGap = Math.max(0, dailyWaterNeed - consumedWater + extraWaterNeeded);
  
  // Calculate fiber score
  const fiberScore = 
    (intake.hadBreakfast === 'full' ? 3 : intake.hadBreakfast === 'light' ? 1 : 0) +
    (intake.hadLunch === 'full' ? 3 : intake.hadLunch === 'light' ? 1 : 0) +
    (intake.fruitsVeggies * 2);
  
  const fiberGap = Math.max(0, 15 - fiberScore); // Target 15 points
  
  // Micronutrient gap
  const micronutrientGap = intake.fruitsVeggies < 5;
  
  return {
    waterGap,
    needsElectrolytes: waterGap > 1500 || metrics.activityToday === 'intense',
    fiberGap,
    micronutrientGap,
    needsEnergy: intake.feelingTired && !intake.coffee
  };
}

export function buildRecommendations(
  metrics: BodyMetrics,
  intake: IntakeAssessment
) {
  const gaps = analyzeGaps(metrics, intake);
  const products = [];
  
  // Hydration products
  if (gaps.waterGap > 1500) {
    products.push({
      ...PRODUCTS.coconutWater500,
      quantity: 2,
      reason: 'High hydration deficit detected'
    });
    products.push({
      ...PRODUCTS.humantra,
      quantity: 1,
      reason: 'Electrolyte replenishment needed'
    });
  } else if (gaps.waterGap > 750) {
    products.push({
      ...PRODUCTS.kombucha350,
      quantity: 1,
      reason: 'Moderate hydration + gut health benefits'
    });
    if (gaps.needsElectrolytes) {
      products.push({
        ...PRODUCTS.humantra,
        quantity: 1,
        reason: 'Activity-based electrolyte needs'
      });
    }
  } else if (gaps.waterGap > 250) {
    products.push({
      ...PRODUCTS.water500,
      quantity: 1,
      reason: 'Light hydration top-up'
    });
  }
  
  // Fiber products
  if (gaps.fiberGap > 10) {
    products.push({
      ...PRODUCTS.riteGutHealth,
      quantity: 2,
      reason: 'Very low fiber intake today'
    });
  } else if (gaps.fiberGap > 5) {
    products.push({
      ...PRODUCTS.riteGutHealth,
      quantity: 1,
      reason: 'Below optimal fiber intake'
    });
  }
  
  // Micronutrients
  if (gaps.micronutrientGap) {
    products.push({
      ...PRODUCTS.riteGreens,
      quantity: 1,
      reason: 'Low vegetable/fruit intake'
    });
  }
  
  // Energy
  if (gaps.needsEnergy) {
    const currentHour = new Date().getHours();
    if (currentHour < 14) {
      products.push({
        ...PRODUCTS.coldBrew,
        quantity: 1,
        reason: 'Natural energy boost needed'
      });
    } else {
      products.push({
        ...PRODUCTS.matchaLatte,
        quantity: 1,
        reason: 'Gentle afternoon energy'
      });
    }
  }
  
  // Calculate total
  const total = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  return {
    products,
    total,
    waterGap: gaps.waterGap,
    summary: generateSummary(gaps)
  };
}

function generateSummary(gaps: any): string {
  const parts = [];
  
  if (gaps.waterGap > 1000) {
    parts.push(`${Math.round(gaps.waterGap / 1000 * 10) / 10}L hydration deficit`);
  }
  
  if (gaps.needsElectrolytes) {
    parts.push('electrolyte replenishment needed');
  }
  
  if (gaps.fiberGap > 5) {
    parts.push('low fiber intake');
  }
  
  if (gaps.micronutrientGap) {
    parts.push('insufficient vegetables');
  }
  
  if (gaps.needsEnergy) {
    parts.push('fatigue support');
  }
  
  return parts.join(', ');
}
