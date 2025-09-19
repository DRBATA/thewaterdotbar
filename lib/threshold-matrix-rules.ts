/**
 * Threshold Matrix Rules for AI-driven Hydration Recommendations
 * Based on the unified HIGHdration tracking matrix
 */

export interface ThresholdRule {
  nutrient: string;
  triggerPoint: number | string;
  response: string[];
  schedulingNote?: string;
}

export const THRESHOLD_MATRIX: ThresholdRule[] = [
  // HYDRATION
  {
    nutrient: 'water',
    triggerPoint: 'below_daily_target',
    response: ['Plain water', 'Coconut water', 'Kombucha'],
    schedulingNote: 'If deficit repeats → lock into 72h or 4-day pack'
  },
  
  // SODIUM
  {
    nutrient: 'sodium',
    triggerPoint: 300, // mg deficit
    response: ['Celery Juice (250 mL)', 'SoSodium – Celery Juice (330 mL)'],
    schedulingNote: 'Alternate celery with other sources across days'
  },
  {
    nutrient: 'sodium',
    triggerPoint: 800, // mg deficit - needs 2 fixes
    response: ['SoSodium – Celery Juice (330 mL)', 'Celery Juice (250 mL)'],
    schedulingNote: '2 fixes needed for >800mg deficit'
  },
  
  // POTASSIUM
  {
    nutrient: 'potassium',
    triggerPoint: 400, // mg deficit
    response: ['Once Upon a Coconut (330 mL)', 'Coconut Water 330 mL (tetra)'],
    schedulingNote: 'Cap coconut water at 1/day'
  },
  {
    nutrient: 'potassium', 
    triggerPoint: 800, // mg deficit - extra fix
    response: ['Once Upon a Coconut (330 mL)', 'Coconut Water (1 cup, 250 mL)'],
    schedulingNote: 'Alternate coconut water options'
  },
  
  // PROTEIN
  {
    nutrient: 'protein',
    triggerPoint: 20, // g deficit
    response: ['Kefir (plain, 250 mL)'],
    schedulingNote: 'Kefir provides protein + probiotics'
  },
  
  // FIBER
  {
    nutrient: 'fiber',
    triggerPoint: 3, // g deficit
    response: ['Poppi Prebiotic Cola (330 mL)'],
    schedulingNote: '<3g deficit → prebiotic cola'
  },
  {
    nutrient: 'fiber',
    triggerPoint: 10, // g deficit
    response: ['Rite Gut Health (1 sachet)'],
    schedulingNote: '<10g deficit → Rite Gut Health'
  },
  
  // GUT CULTURES
  {
    nutrient: 'probiotics',
    triggerPoint: 'none_in_24h',
    response: ['Kefir (plain, 250 mL)', 'YALA Kombucha × New Mind Chaga (250 mL)', 'Poppi Prebiotic Cola (330 mL)'],
    schedulingNote: 'Rotate across days; not same >2 consecutive days'
  },
  
  // B VITAMINS
  {
    nutrient: 'b6',
    triggerPoint: 0.5, // <50% of RDA
    response: ['Rite Greens (1 sachet)'],
    schedulingNote: 'Escalate if repeated deficit'
  },
  {
    nutrient: 'b9',
    triggerPoint: 0.5, // <50% of RDA
    response: ['Rite Greens (1 sachet)'],
    schedulingNote: 'Check greens intake baseline'
  },
  {
    nutrient: 'b12',
    triggerPoint: 0.5, // <50% for 2 days
    response: ['Kefir (plain, 250 mL)'],
    schedulingNote: 'B12 + cultures synergy; 3-day deficit → supplement'
  },
  
  // MINERALS
  {
    nutrient: 'magnesium',
    triggerPoint: 0.25, // <25% of RDA
    response: ['Rite Greens (1 sachet)', 'Kefir (plain, 250 mL)'],
    schedulingNote: 'Evening intake preferred (sleep + muscle relaxation)'
  },
  {
    nutrient: 'iron',
    triggerPoint: 0.2, // <20% of RDA
    response: ['Meat', 'Legumes', 'Rite Greens'],
    schedulingNote: 'Track gender-specific thresholds'
  },
  {
    nutrient: 'zinc',
    triggerPoint: 0.3, // <30% of RDA
    response: ['Nuts', 'Seeds', 'Rite Greens'],
    schedulingNote: 'Rotate nuts ↔ seeds'
  },
  {
    nutrient: 'copper',
    triggerPoint: 0.4, // <40% of RDA
    response: ['Nuts', 'Seeds', 'Seafood'],
    schedulingNote: 'Watch zinc:copper balance'
  },
  {
    nutrient: 'choline',
    triggerPoint: 0.3, // <30% of RDA
    response: ['Eggs', 'Salmon', 'Chicken', 'Kefir with phosphatidylcholine'],
    schedulingNote: 'Daily tracking; avoid chronic deficiency'
  },
  
  // ANTIOXIDANTS
  {
    nutrient: 'vitamin_c',
    triggerPoint: 0.5, // <50% of RDA
    response: ['Broccoli', 'Citrus', 'Rite Greens'],
    schedulingNote: 'Persistent deficit → flag immune check'
  },
  {
    nutrient: 'polyphenols',
    triggerPoint: 'none_logged',
    response: ['Kombucha', 'Prebiotic cola', 'Berries'],
    schedulingNote: 'Variety encouraged across week'
  },
  {
    nutrient: 'omega3',
    triggerPoint: 0.3, // <30% of RDA
    response: ['Chia', 'Flax', 'Oily fish', 'Rite Greens'],
    schedulingNote: 'Weekly balance; ≥2 oily fish meals/week'
  },
  
  // CAFFEINE LIMITS
  {
    nutrient: 'caffeine',
    triggerPoint: 'coffee_gt_4',
    response: ['Yerba', 'Kombucha swap'],
    schedulingNote: 'Balance cola with prebiotic version'
  }
];

// Rotation rules to prevent repetition
export const ROTATION_PAIRS = [
  ['kefir', 'kombucha'],
  ['celery juice', 'mineral water', 'broth'],
  ['prebiotic cola', 'Rite Gut Health'],
  ['coconut water', 'banana smoothie'],
  ['nuts', 'seeds']
];

/**
 * Apply threshold matrix rules to generate recommendations
 */
export function applyThresholdRules(
  deficits: Record<string, number>,
  dailyTargets: Record<string, number>,
  recentProducts: string[] = []
): string[] {
  const recommendations: string[] = [];
  
  // Check each threshold rule
  for (const rule of THRESHOLD_MATRIX) {
    let triggered = false;
    
    if (typeof rule.triggerPoint === 'number') {
      // Absolute threshold
      if (deficits[rule.nutrient] > rule.triggerPoint) {
        triggered = true;
      }
    } else if (typeof rule.triggerPoint === 'string') {
      // Special conditions
      if (rule.triggerPoint === 'below_daily_target' && deficits[rule.nutrient] > 0) {
        triggered = true;
      } else if (rule.triggerPoint === 'none_in_24h' && deficits[rule.nutrient] === dailyTargets[rule.nutrient]) {
        triggered = true;
      } else if (rule.triggerPoint === 'none_logged' && deficits[rule.nutrient] === dailyTargets[rule.nutrient]) {
        triggered = true;
      } else if (rule.triggerPoint.includes('_gt_')) {
        // Handle caffeine limits etc
        triggered = true; // Would need actual caffeine count
      }
    } else if (rule.triggerPoint < 1) {
      // Percentage threshold
      const percentDeficit = deficits[rule.nutrient] / dailyTargets[rule.nutrient];
      if (percentDeficit > rule.triggerPoint) {
        triggered = true;
      }
    }
    
    if (triggered) {
      // Apply rotation logic - don't recommend recently used products
      for (const product of rule.response) {
        if (!recentProducts.includes(product.toLowerCase()) && 
            !recommendations.includes(product)) {
          recommendations.push(product);
          break; // Only add one per rule unless specified
        }
      }
    }
  }
  
  return recommendations;
}

/**
 * Apply variety rules to prevent same item appearing >3 consecutive days
 */
export function applyRotationRules(
  recommendations: string[],
  previousDaysProducts: string[][]
): string[] {
  const rotated: string[] = [];
  
  for (const product of recommendations) {
    // Count consecutive days this product appeared
    let consecutiveDays = 0;
    for (const dayProducts of previousDaysProducts) {
      if (dayProducts.includes(product)) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    // If used 3+ days, find a rotation pair
    if (consecutiveDays >= 3) {
      const rotationGroup = ROTATION_PAIRS.find(group => 
        group.some(item => item.toLowerCase() === product.toLowerCase())
      );
      
      if (rotationGroup) {
        // Find alternative in rotation group
        const alternative = rotationGroup.find(item => 
          item.toLowerCase() !== product.toLowerCase() &&
          !previousDaysProducts[0].includes(item)
        );
        
        if (alternative) {
          rotated.push(alternative);
        }
      }
    } else {
      rotated.push(product);
    }
  }
  
  return rotated;
}
