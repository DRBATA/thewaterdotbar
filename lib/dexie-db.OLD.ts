import Dexie, { Table } from 'dexie';
import { Sex, ActivityLevel, SweatContext, NutrientTargets, NutritionalIntake } from '@/types';

/**
 * HYDRATION ASSESSMENT
 * Stores the user's profile and targets when they build a plan
 * One assessment per 24-hour period
 */
export interface HydrationAssessment {
  id?: number;
  timestamp: Date;
  expiresAt: Date; // 24 hours after creation
  
  // User's profile inputs
  profile: {
    weight: number;
    bodyFat: number;
    sex: Sex;
    activityLevel: ActivityLevel;
    sweatContext: SweatContext;
    sessionHours: number;
  };
  
  // Calculated hydration targets (5 key nutrients)
  targets: NutrientTargets; // water, sodium, potassium, protein, fiber
  
  // Meals consumed (from AI parser - all 24 nutrients)
  mealsIntake: NutritionalIntake;
}

/**
 * DRINK LOG
 * Records each drink consumed (from email or manual add)
 * Append-only, linked to assessment
 */
export interface DrinkLog {
  id?: number;
  assessment_id: number; // Links to HydrationAssessment
  product_id: string;
  name: string;
  quantity: number;
  timestamp: Date;
  nutrients: NutritionalIntake; // All 24 nutrients from this drink
  source: 'email' | 'manual' | 'purchase'; // How it was logged
}

/**
 * CLEAN SLATE DATABASE
 * Only 2 tables: assessments + drink logs
 */
class WaterBarHydrationDB extends Dexie {
  hydration_assessments!: Table<HydrationAssessment>;
  drink_logs!: Table<DrinkLog>;

  constructor() {
    super('WaterBarHydrationDB');
    
    // Version 1: Clean start with only 2 tables
    this.version(1).stores({
      hydration_assessments: '++id, timestamp, expiresAt',
      drink_logs: '++id, assessment_id, timestamp, source'
    });
  }
}

// Create database instance
export const db = new WaterBarHydrationDB();

/**
 * HELPER FUNCTIONS
 */

// Assessment Helpers
export const assessmentHelpers = {
  /**
   * Save a new hydration assessment (when user clicks "Generate Plan")
   */
  async saveAssessment(context: {
    profile: HydrationAssessment['profile'];
    targets: NutrientTargets;
    mealsIntake: NutritionalIntake;
  }): Promise<number> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const assessment: HydrationAssessment = {
      timestamp: now,
      expiresAt,
      profile: context.profile,
      targets: context.targets,
      mealsIntake: context.mealsIntake
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
   * Log consumed drinks (from email or manual)
   */
  async logDrinks(drinks: Array<{
    product_id: string;
    name: string;
    quantity: number;
    nutrients: NutritionalIntake;
  }>, source: 'email' | 'manual' | 'purchase' = 'email'): Promise<void> {
    // Get or create assessment
    let assessment = await assessmentHelpers.getCurrentAssessment();
    
    if (!assessment) {
      console.warn('⚠️ No active assessment - creating default');
      // Create minimal assessment for logging
      const assessmentId = await assessmentHelpers.saveAssessment({
        profile: {
          weight: 70,
          bodyFat: 20,
          sex: 'male',
          activityLevel: 'moderate',
          sweatContext: 'moderate',
          sessionHours: 1
        },
        targets: {
          water: 2500,
          sodium: 1890,
          potassium: 2940,
          protein: 84,
          fiber: 20
        },
        mealsIntake: {} as NutritionalIntake
      });
      assessment = await db.hydration_assessments.get(assessmentId) || null;
    }
    
    if (!assessment) {
      throw new Error('Failed to create assessment');
    }
    
    // Add each drink to log
    for (const drink of drinks) {
      await db.drink_logs.add({
        assessment_id: assessment.id!,
        product_id: drink.product_id,
        name: drink.name,
        quantity: drink.quantity,
        timestamp: new Date(),
        nutrients: drink.nutrients,
        source
      });
    }
    
    console.log(`✅ Logged ${drinks.length} drinks to assessment ${assessment.id}`);
  },

  /**
   * Get all drinks for current assessment
   */
  async getTodaysDrinks(): Promise<DrinkLog[]> {
    const assessment = await assessmentHelpers.getCurrentAssessment();
    if (!assessment) return [];
    
    return await db.drink_logs
      .where('assessment_id')
      .equals(assessment.id!)
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
  }
};

// Legacy helper to avoid breaking imports
export const profileHelpers = {
  calculateLBM(weight: number, bodyType: string, gender: string = 'average'): number {
    // Male body fat percentages (from original reference)
    const maleBodyFat = {
      shredded: 0.08,        // 8% - six-pack, veiny
      athletic: 0.125,       // 12.5% - lean
      fit: 0.175,           // 17.5% - in shape
      average: 0.225,       // 22.5% - normal
      dad_bod: 0.27,        // 27% - carrying extra, bit of a belly
      overweight: 0.33,     // 33% - heavyset, big guy
      obese: 0.45,          // 45% - obese
      stocky_muscular: 0.20 // 20% - rugby build, thick legs
    };
    
    // Female body fat percentages (from original reference)
    const femaleBodyFat = {
      very_athletic: 0.175, // 17.5% - very lean
      fit: 0.225,           // 22.5% - toned
      healthy: 0.275,       // 27.5% - curves
      average: 0.325,       // 32.5% - normal
      curvy_soft: 0.37,     // 37% - carrying extra
      overweight: 0.45,     // 45% - overweight
      // Map some male types for flexibility
      athletic: 0.175,      // Same as very_athletic
      shredded: 0.175,      // Same as very_athletic
      dad_bod: 0.37,        // Same as curvy_soft
      obese: 0.45,          // Same as overweight
      stocky_muscular: 0.275 // Same as healthy
    };
    
    const bodyFatMap = gender === 'male' ? maleBodyFat : femaleBodyFat;
    const bodyFat = bodyFatMap[bodyType as keyof typeof bodyFatMap] || (gender === 'male' ? 0.225 : 0.325);
    
    return Math.round(weight * (1 - bodyFat));
  },

  // Get or create profile
  async getOrCreateProfile(): Promise<UserProfile | null> {
    const profiles = await db.profile.toArray();
    if (profiles.length > 0) {
      return profiles[0]; // Return existing profile
    }
    return null; // No profile yet
  },

  // Save profile with LBM calculation
  async saveProfile(data: Partial<UserProfile>): Promise<void> {
    const existing = await this.getOrCreateProfile();
    
    console.log('🔧 SAVE_PROFILE DEBUG:', {
      existing: existing?.id,
      data,
      hasExisting: !!existing
    });
    
    // Calculate LBM if weight, bodyType, and gender provided
    let lbm = data.lbm;
    if (data.weight && data.bodyType && data.gender && !lbm) {
      lbm = this.calculateLBM(data.weight, data.bodyType, data.gender);
    }
    
    if (existing) {
      // Update existing
      console.log('🔧 UPDATING profile ID:', existing.id, 'with data:', { ...data, lbm });
      console.log('🔧 Full existing profile:', existing);
      
      try {
        const result = await db.profile.update(existing.id!, {
          ...data,
          lbm,
          updatedAt: new Date()
        });
        console.log('🔧 UPDATE result:', result);
        
        // Verify the update worked by reading it back
        const updated = await db.profile.get(existing.id!);
        console.log('🔧 VERIFICATION - Updated profile:', updated);
      } catch (updateError) {
        console.error('🔧 UPDATE FAILED:', updateError);
      }
    } else {
      // Create new
      console.log('🔧 CREATING new profile with data:', { ...data, lbm });
      const id = await db.profile.add({
        nickname: data.nickname || '',
        weight: data.weight || 150,
        gender: data.gender || 'prefer_not_to_say',
        bodyType: data.bodyType || 'average',
        lbm,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('🔧 CREATE result ID:', id);
    }
    
    // Sync to bridge API for agent access
    await this.syncToAgent();
  },

  // Sync profile data to bridge API
  async syncToAgent(): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile();
      if (!profile) return;

      const response = await fetch('/api/bridge/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: profile.nickname,
          weight: profile.weight,
          gender: profile.gender,
          bodyType: profile.bodyType,
          lbm: profile.lbm
        })
      });

      if (response.ok) {
        console.log('✅ Profile synced to agent bridge');
      } else {
        console.error('❌ Failed to sync profile to bridge:', response.status);
      }
    } catch (error) {
      console.error('❌ Profile bridge sync error:', error);
    }
  }
};

export const settingsHelpers = {
  // Get or create settings
  async getOrCreateSettings(): Promise<UserSettings> {
    const settings = await db.settings.toArray();
    if (settings.length > 0) {
      return settings[0];
    }
    
    // Create default settings
    const defaultSettings: UserSettings = {
      gpsConsent: false,
      dataStorageConsent: true,
      quickMode: false,
      theme: 'light',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const id = await db.settings.add(defaultSettings);
    return { ...defaultSettings, id };
  },

  // Update settings
  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    const current = await this.getOrCreateSettings();
    await db.settings.update(current.id!, {
      ...updates,
      updatedAt: new Date()
    });
  }
};

export const targetHelpers = {
  // Get today's target
  async getTodayTarget(): Promise<HydrationTarget | null> {
    const today = new Date().toISOString().split('T')[0];
    const targets = await db.targets.where('date').equals(today).toArray();
    return targets.length > 0 ? targets[0] : null;
  },

  // Save or update today's target
  async saveTodayTarget(data: Partial<HydrationTarget>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getTodayTarget();
    
    if (existing) {
      await db.targets.update(existing.id!, {
        ...data,
        updatedAt: new Date()
      });
    } else {
      await db.targets.add({
        date: today,
        baseTarget: data.baseTarget || 2000, // ml per day (default ~2L)
        currentIntake: data.currentIntake || 0,
        deficit: data.deficit || 2000,
        fireVsIce: data.fireVsIce || 'balanced',
        products: data.products || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
};

export const ownedProductsHelpers = {
  async addProduct(product: Omit<OwnedProduct, 'id' | 'createdAt' | 'consumptions'>) {
    await db.owned_products.add({
      ...product,
      consumptions: [],
      createdAt: new Date()
    });
  },

  async getActiveProducts() {
    return await db.owned_products.where('isActive').equals(1).toArray();
  },

  async getAllProducts() {
    return await db.owned_products.orderBy('purchaseDate').reverse().toArray();
  },

  async deactivateProduct(id: number) {
    await db.owned_products.update(id, { isActive: false });
  },

  // Track when user consumes a product
  async logConsumption(productId: number, amount: string, context?: string) {
    const product = await db.owned_products.get(productId);
    if (!product) return;

    const newConsumption = {
      timestamp: new Date(),
      amount,
      context
    };

    await db.owned_products.update(productId, {
      consumptions: [...product.consumptions, newConsumption]
    });
  },

  // Get recent consumptions for AI context
  async getRecentConsumptions(hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const products = await this.getActiveProducts();
    
    const recentConsumptions: Array<{
      product: OwnedProduct;
      consumption: { timestamp: Date; amount: string; context?: string };
    }> = [];

    products.forEach(product => {
      product.consumptions
        .filter(c => c.timestamp > cutoff)
        .forEach(consumption => {
          recentConsumptions.push({ product, consumption });
        });
    });

    return recentConsumptions.sort((a, b) => 
      b.consumption.timestamp.getTime() - a.consumption.timestamp.getTime()
    );
  }
};

export const sweatTestHelpers = {
  // Save a new sweat test
  async saveSweatTest(data: Omit<SweatTestData, 'id' | 'createdAt' | 'sweatRate'>): Promise<number> {
    // Calculate sweat rate: (pre_weight - post_weight + fluids_consumed) / hours
    const weightLoss = data.preWorkoutWeight - data.postWorkoutWeight; // kg
    const totalFluidLoss = weightLoss + (data.fluidConsumed / 1000); // kg to L
    const hours = data.workoutDuration / 60;
    const sweatRate = totalFluidLoss / hours; // L/hour
    
    const testData: SweatTestData = {
      ...data,
      sweatRate,
      createdAt: new Date()
    };
    
    const id = await db.sweat_tests.add(testData);
    
    // Update profile with latest sweat data
    await this.updateProfileSweatData();
    
    return id;
  },

  // Get all sweat tests for analysis
  async getAllSweatTests(): Promise<SweatTestData[]> {
    return await db.sweat_tests.orderBy('testDate').reverse().toArray();
  },

  // Get recent sweat tests (last 30 days)
  async getRecentSweatTests(days: number = 30): Promise<SweatTestData[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await db.sweat_tests.where('testDate').above(cutoff).toArray();
  },

  // Update profile with average sweat data from recent tests
  async updateProfileSweatData(): Promise<void> {
    const recentTests = await this.getRecentSweatTests(90); // Last 3 months
    if (recentTests.length === 0) return;

    // Calculate averages
    const avgSweatRate = recentTests.reduce((sum, test) => sum + test.sweatRate, 0) / recentTests.length;
    const sodiumTests = recentTests.filter(test => test.sweatSodium);
    const avgSweatSodium = sodiumTests.length > 0 
      ? sodiumTests.reduce((sum, test) => sum + (test.sweatSodium || 0), 0) / sodiumTests.length
      : undefined;

    // Update profile
    const profile = await profileHelpers.getOrCreateProfile();
    if (profile) {
      await profileHelpers.saveProfile({
        sweatRate: Math.round(avgSweatRate * 100) / 100, // Round to 2 decimals
        sweatSodium: avgSweatSodium ? Math.round(avgSweatSodium) : undefined
      });
    }
  },

  // Get personalized sweat data for agent
  async getPersonalizedSweatData(): Promise<{ sweatRate?: number; sweatSodium?: number }> {
    const profile = await profileHelpers.getOrCreateProfile();
    return {
      sweatRate: profile?.sweatRate,
      sweatSodium: profile?.sweatSodium
    };
  }
};

// Removed planHelpers and consumptionHelpers - keeping schema simple
