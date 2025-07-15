import { UserProfile, TimelineEvent } from './client-db';

// Define the structure for daily nutritional needs
export interface DailyNeeds {
  water_ml: number;
  sodium_mg: number;
  potassium_mg: number;
  protein_g: number;
}

/**
 * Calculates the estimated body fat percentage based on colloquial descriptions.
 * Note: This is a very rough estimation for demonstration purposes.
 * @param bodyType - A string describing the user's body type.
 * @returns Estimated body fat percentage.
 */
function estimateBodyFatPercentage(bodyType: string): number {
  const lowerBodyType = bodyType.toLowerCase();
  if (lowerBodyType.includes('athletic') || lowerBodyType.includes('lean')) return 15;
  if (lowerBodyType.includes('fit') || lowerBodyType.includes('average')) return 20;
  if (lowerBodyType.includes('large') || lowerBodyType.includes('heavy')) return 25;
  return 22; // Default fallback
}

/**
 * Calculates the user's daily nutritional needs based on their profile.
 * @param profile - The user's profile data.
 * @returns An object containing the calculated daily needs for major KPIs.
 */
export function calculateDailyNeeds(profile: UserProfile): DailyNeeds {
  const { weight, activityLevel, bodyType } = profile;

  if (!weight) {
    // Return baseline needs if profile is incomplete
    return { water_ml: 2500, sodium_mg: 1500, potassium_mg: 3500, protein_g: 50 };
  }

  const bodyFatPercentage = estimateBodyFatPercentage(bodyType || 'average');
  const leanMassKg = weight * (1 - bodyFatPercentage / 100);

  // --- Hydration Calculation ---
  // Base intake: 35ml per kg of lean body mass
  let water_ml = leanMassKg * 35;

  // --- Activity Level Modifier ---
  switch (activityLevel) {
    case 'light':
      water_ml += 500;
      break;
    case 'moderate':
      water_ml += 1000;
      break;
    case 'high':
    case 'very high':
      water_ml += 1500;
      break;
  }

  // --- Other KPI Calculations (simplified examples) ---
  const sodium_mg = 1500 + (activityLevel === 'high' ? 500 : 0);
  const potassium_mg = 3500;
  const protein_g = Math.max(50, leanMassKg * 1.2); // 1.2g of protein per kg of lean mass

  return {
    water_ml: Math.round(water_ml),
    sodium_mg: Math.round(sodium_mg),
    potassium_mg: Math.round(potassium_mg),
    protein_g: Math.round(protein_g),
  };
}

/**
 * Calculates the remaining nutritional needs (the 'gap') for the day.
 * @param profile - The user's profile.
 * @param timelineEvents - An array of timeline events for the day.
 * @returns An object representing the nutritional gap.
 */
export function calculateNeedsGap(profile: UserProfile, timelineEvents: TimelineEvent[]): DailyNeeds {
  const dailyNeeds = calculateDailyNeeds(profile);

  // Sum up all completed events with their direct KPI values
  const consumed = timelineEvents
    .filter(event => event.isCompleted)
    .reduce((acc, event) => {
      acc.water_ml += event.kpi_water_ml || 0;
      acc.sodium_mg += event.kpi_sodium_mg || 0;
      acc.potassium_mg += event.kpi_potassium_mg || 0;
      acc.protein_g += event.kpi_protein_g || 0;
      return acc;
    }, { water_ml: 0, sodium_mg: 0, potassium_mg: 0, protein_g: 0 });

  // Calculate the gap - ensure it's always positive or zero
  return {
    water_ml: Math.max(0, dailyNeeds.water_ml - consumed.water_ml),
    sodium_mg: Math.max(0, dailyNeeds.sodium_mg - consumed.sodium_mg),
    potassium_mg: Math.max(0, dailyNeeds.potassium_mg - consumed.potassium_mg),
    protein_g: Math.max(0, dailyNeeds.protein_g - consumed.protein_g),
  };
}

// --- Phase 3: Solution Finding ---

// Define the shape of a product from the database
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  h2o_ml: number | null;
  na_mg: number | null;
  k_mg: number | null;
  protein_g: number | null;
}

// Define the shape of a solution basket
export interface SolutionBasket {
  items: Product[];
  total_water_ml: number;
  total_sodium_mg: number;
  total_potassium_mg: number;
  total_protein_g: number;
  score: number; // A score indicating how well this basket meets the needs
}

/**
 * Finds combinations of products to meet a nutritional gap.
 * This uses a combinatorial approach to find the best-fitting baskets.
 * @param needsGap - The nutritional deficit to be filled.
 * @param products - A list of all available products from the menu.
 * @returns An array of potential solution baskets, sorted by best fit.
 */
export function findHydrationSolutions(needsGap: DailyNeeds, products: Product[]): SolutionBasket[] {
  const solutions: SolutionBasket[] = [];
  const maxItemsPerBasket = 3;

  // Helper to calculate a basket's total nutrition and score
  const calculateBasket = (items: Product[]): SolutionBasket => {
    const totals = items.reduce((acc, item) => ({
      water_ml: acc.water_ml + (item.h2o_ml || 0),
      sodium_mg: acc.sodium_mg + (item.na_mg || 0),
      potassium_mg: acc.potassium_mg + (item.k_mg || 0),
      protein_g: acc.protein_g + (item.protein_g || 0),
    }), { water_ml: 0, sodium_mg: 0, potassium_mg: 0, protein_g: 0 });

    // Scoring logic: Lower is better. Penalize for going over the need.
    const water_diff = Math.abs(needsGap.water_ml - totals.water_ml);
    const sodium_diff = Math.abs(needsGap.sodium_mg - totals.sodium_mg) * 5; // Sodium is critical
    const protein_diff = Math.abs(needsGap.protein_g - totals.protein_g) * 2;
    const score = water_diff + sodium_diff + protein_diff;

    return {
      items,
      total_water_ml: totals.water_ml,
      total_sodium_mg: totals.sodium_mg,
      total_potassium_mg: totals.potassium_mg,
      total_protein_g: totals.protein_g,
      score,
    };
  };

  // Iterate through combinations of 1, 2, and 3 products
  for (let i = 0; i < products.length; i++) {
    // Baskets of 1
    solutions.push(calculateBasket([products[i]]));

    for (let j = i + 1; j < products.length; j++) {
      // Baskets of 2
      solutions.push(calculateBasket([products[i], products[j]]));

      for (let k = j + 1; k < products.length; k++) {
        // Baskets of 3
        solutions.push(calculateBasket([products[i], products[j], products[k]]));
      }
    }
  }

  // Filter out solutions that grossly overshoot the needs (e.g., >200% of water)
  const filteredSolutions = solutions.filter(s => s.total_water_ml < needsGap.water_ml * 2.5);

  // Sort solutions by score (lower is better) and return the top 5
  return filteredSolutions.sort((a, b) => a.score - b.score).slice(0, 5);
}
