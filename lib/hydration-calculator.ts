import type { UserProfile } from './client-db';

// Defines the structure for the calculated daily needs
export interface DailyNeeds {
  water_ml: number;
  sodium_mg: number;
  potassium_mg: number;
  protein_g: number;
}

// Multipliers for activity level to adjust baseline needs
const activityMultipliers = {
  sedentary: 1.0,   // Baseline
  light: 1.1,       // Light exercise/less active job
  moderate: 1.2,    // Moderate exercise 3-5 days/week
  active: 1.3,      // Hard exercise 6-7 days/week
  'very-active': 1.4, // Strenuous daily exercise or physical job
};

/**
 * Calculates the daily hydration and nutrition needs based on a user's profile.
 * This function contains the core scientific logic, separated from the UI and API.
 * @param profile - The user's profile data from the client
 * @returns The calculated daily needs, or null if the profile is incomplete.
 */
export function calculateDailyNeeds(profile: UserProfile | null): DailyNeeds | null {
  // Guard clause: If we don't have the essential info, we can't calculate.
  if (!profile || !profile.weightKg || profile.estimatedBodyFatPercentage === undefined || !profile.activityLevel) {
    return null;
  }

  // 1. Calculate or Retrieve Lean Body Mass (LBM)
  // Use the stored LBM for efficiency if it exists. Otherwise, calculate it.
  const leanBodyMassKg = profile.leanBodyMassKg ?? profile.weightKg * (1 - profile.estimatedBodyFatPercentage);

  // 2. Calculate Water Needs
  // Base formula: 35ml of water per kg of body weight (a common clinical guideline)
  const baseWaterNeeds = profile.weightKg * 35;

  // 3. Calculate Protein Needs
  // Base formula: ~1.6g of protein per kg of LBM for general fitness and muscle maintenance
  const baseProteinNeeds = leanBodyMassKg * 1.6;

  // 4. Adjust for Activity Level
  const activityMultiplier = activityMultipliers[profile.activityLevel];
  const finalWaterNeeds = baseWaterNeeds * activityMultiplier;

  // 5. Calculate Electrolyte Needs (general guidelines from health authorities)
  const sodiumNeeds = 1500; // mg, a general baseline for adults
  const potassiumNeeds = 3500; // mg, a general baseline for adults

  return {
    water_ml: Math.round(finalWaterNeeds),
    sodium_mg: Math.round(sodiumNeeds),
    potassium_mg: Math.round(potassiumNeeds),
    // Protein needs are not typically scaled with the same activity multiplier as water,
    // as the 1.6g/kg LBM figure already accounts for an active lifestyle.
    // We will stick to the LBM calculation for a reliable protein target.
    protein_g: Math.round(baseProteinNeeds),
  };
}