import Dexie, { Table } from 'dexie';
import { Sex, ActivityLevel, SweatContext, NutrientTargets, NutritionalIntake } from '@/types';

/**
 * USER PROFILE
 * Stores permanent user data (never expires)
 * Weight, body composition, allergies
 */
export interface UserProfile {
  id?: number;
  weight: number;
  bodyFat: number;
  sex: Sex;
  allergies: string; // Comma-separated or stored as-is from input
  updatedAt: Date;
}

/**
 * HYDRATION ASSESSMENT
 * Stores daily context and targets
 * Expires after 24 hours
 */
export interface HydrationAssessment {
  id?: number;
  timestamp: Date;
  expiresAt: Date; // 24 hours after creation
  
  // References user profile (doesn't duplicate it)
  profile_id: number;
  
  // TODAY's activity context
  activityLevel: ActivityLevel;
  sweatContext: SweatContext;
  sessionHours: number;
  
  // Calculated hydration targets (5 key nutrients)
  targets: NutrientTargets; // water, sodium, potassium, protein, fiber
  
  // Meals entered TODAY (from AI parser - all 24 nutrients)
  meals: {
    breakfast: string; // Raw text input
    lunch: string;
    dinner: string;
    snacks: string;
    parsed: NutritionalIntake; // AI parsed nutrition
  };
  
  // AI Recommendations (optional - only if user generated plan)
  recommendations?: {
    deficits: Partial<NutritionalIntake>;
    recommended_drinks: Array<{
      name: string;
      quantity: number;
      nutrients_provided: any;
      reason: string;
    }>;
    recommended_meals: Array<{
      name: string;
      description: string;
      imageUrl?: string;
      nutrients_provided: any;
      foods: string[];
      items: any[];
    }>;
  };
}

/**
 * DRINK LOG
 * Records each drink consumed (from email or manual add)
 * Append-only, optionally linked to assessment
 */
export interface DrinkLog {
  id?: number;
  assessment_id?: number; // Optional - links to HydrationAssessment if user has one
  product_id: string;
  name: string;
  quantity: number;
  timestamp: Date;
  nutrients: NutritionalIntake; // All 24 nutrients from this drink
  source: 'email' | 'manual' | 'purchase' | 'email_tracking'; // How it was logged
  hydration_date: string; // YYYY-MM-DD for 24-hour period grouping (REQUIRED)
}

/**
 * CLEAN SLATE DATABASE
 * 3 tables: user profile (permanent) + assessments (24h) + drink logs (24h)
 */
class WaterBarHydrationDB extends Dexie {
  user_profile!: Table<UserProfile>;
  hydration_assessments!: Table<HydrationAssessment>;
  drink_logs!: Table<DrinkLog>;

  constructor() {
    super('WaterBarHydrationDB');
    
    // Version 1: Clean start with 3 tables
    this.version(1).stores({
      user_profile: '++id, updatedAt',
      hydration_assessments: '++id, profile_id, timestamp, expiresAt',
      drink_logs: '++id, assessment_id, timestamp, source, hydration_date' // Index by date!
    });
  }
}

// Create database instance
export const db = new WaterBarHydrationDB();

/**
 * HELPER FUNCTIONS
 */

// Profile Helpers
export const profileHelpers = {
  /**
   * Get or create user profile
   */
  async getProfile(): Promise<UserProfile | null> {
    const profiles = await db.user_profile.toArray();
    return profiles.length > 0 ? profiles[0] : null;
  },

  /**
   * Save or update user profile (permanent data)
   */
  async saveProfile(data: {
    weight: number;
    bodyFat: number;
    sex: Sex;
    allergies?: string;
  }): Promise<number> {
    const existing = await this.getProfile();
    
    if (existing) {
      // Update existing
      await db.user_profile.update(existing.id!, {
        ...data,
        updatedAt: new Date()
      });
      console.log('✅ Updated user profile');
      return existing.id!;
    } else {
      // Create new
      const id = await db.user_profile.add({
        weight: data.weight,
        bodyFat: data.bodyFat,
        sex: data.sex,
        allergies: data.allergies || '',
        updatedAt: new Date()
      });
      console.log('✅ Created user profile:', id);
      return id;
    }
  }
};

// Assessment Helpers
export const assessmentHelpers = {
  /**
   * Save a new hydration assessment (when user clicks "Generate Plan")
   */
  async saveAssessment(context: {
    profile: {
      weight: number;
      bodyFat: number;
      sex: Sex;
      allergies?: string;
    };
    activityLevel: ActivityLevel;
    sweatContext: SweatContext;
    sessionHours: number;
    targets: NutrientTargets;
    meals: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string;
      parsed: NutritionalIntake;
    };
  }): Promise<number> {
    // Save or update profile first
    const profileId = await profileHelpers.saveProfile(context.profile);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const assessment: HydrationAssessment = {
      timestamp: now,
      expiresAt,
      profile_id: profileId,
      activityLevel: context.activityLevel,
      sweatContext: context.sweatContext,
      sessionHours: context.sessionHours,
      targets: context.targets,
      meals: context.meals
    };
    
    const id = await db.hydration_assessments.add(assessment);
    console.log('✅ Saved hydration assessment:', id);
    return id;
  },

  /**
   * Get the current active assessment (not expired)
   */
  async getCurrentAssessment(): Promise<HydrationAssessment | null> {
    const now = new Date();
    const assessment = await db.hydration_assessments
      .where('expiresAt')
      .above(now)
      .last();
    
    return assessment || null;
  },

  /**
   * Clear expired assessments (older than 24h)
   */
  async clearExpired(): Promise<void> {
    const now = new Date();
    const expired = await db.hydration_assessments
      .where('expiresAt')
      .below(now)
      .toArray();
    
    // Delete expired assessments and their drink logs
    for (const assessment of expired) {
      await db.drink_logs.where('assessment_id').equals(assessment.id!).delete();
      await db.hydration_assessments.delete(assessment.id!);
    }
    
    console.log(`🗑️ Cleared ${expired.length} expired assessments`);
  }
};

// Drink Log Helpers
export const drinkLogHelpers = {
  /**
   * Log consumed drinks (simple tracking - NO assessment required!)
   */
  async logDrinks(drinks: Array<{
    product_id: string;
    name: string;
    quantity: number;
    nutrients: NutritionalIntake;
  }>, source: 'email' | 'manual' | 'purchase' | 'email_tracking' = 'email'): Promise<void> {
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Optionally link to assessment if one exists
    const assessment = await assessmentHelpers.getCurrentAssessment();
    
    // Add each drink to log (assessment_id is OPTIONAL now!)
    for (const drink of drinks) {
      await db.drink_logs.add({
        assessment_id: assessment?.id, // Optional - only if user has done "Generate Plan"
        product_id: drink.product_id,
        name: drink.name,
        quantity: drink.quantity,
        timestamp: new Date(),
        nutrients: drink.nutrients,
        source,
        hydration_date: today // Required - for daily grouping
      });
    }
    
    const msg = assessment 
      ? `✅ Logged ${drinks.length} drinks to assessment ${assessment.id}`
      : `✅ Logged ${drinks.length} drinks (simple tracking - no assessment yet)`;
    console.log(msg);
  },

  /**
   * Get all drinks for today (by date, not assessment)
   */
  async getTodaysDrinks(): Promise<DrinkLog[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return await db.drink_logs
      .where('hydration_date')
      .equals(today)
      .toArray();
  },

  /**
   * Calculate total intake from today's drinks
   */
  async getTodaysTotalIntake(): Promise<NutritionalIntake> {
    const drinks = await this.getTodaysDrinks();
    
    const emptyIntake: NutritionalIntake = {
      water: 0, sodium: 0, potassium: 0, protein: 0, fiber: 0,
      soluble_fiber: 0, insoluble_fiber: 0, magnesium: 0, calcium: 0,
      iron: 0, zinc: 0, copper: 0, choline: 0, b6: 0, b9: 0, b12: 0,
      vitamin_c: 0, vitamin_d: 0, caffeine: 0, probiotics: 0,
      omega3: 0, polyphenols: 0
    };
    
    return drinks.reduce((total, drink) => {
      Object.keys(drink.nutrients).forEach(key => {
        const nutrientKey = key as keyof NutritionalIntake;
        total[nutrientKey] = (total[nutrientKey] || 0) + (drink.nutrients[nutrientKey] || 0);
      });
      return total;
    }, emptyIntake);
  },

  /**
   * Check if user is tracking drinks without an assessment
   */
  async hasTrackedDrinksWithoutAssessment(): Promise<boolean> {
    const assessment = await assessmentHelpers.getCurrentAssessment();
    if (assessment) return false; // Has assessment, all good
    
    const todaysDrinks = await this.getTodaysDrinks();
    return todaysDrinks.length > 0; // Has drinks but no assessment
  }
};
