import Dexie, { Table } from 'dexie';

// Profile data structure
export interface UserProfile {
  id?: number;
  nickname: string;
  weight: number; // in lbs
  bodyType: 'athletic' | 'average' | 'larger' | 'petite' | 'powerlifter' | 'runner' | 'swimmer' | 'dancer' | 'couch_potato';
  lbm?: number; // Lean Body Mass (calculated)
  createdAt: Date;
  updatedAt: Date;
}

// Settings including GPS consent
export interface UserSettings {
  id?: number;
  gpsConsent: boolean; // For weather & venue location
  dataStorageConsent: boolean; // For local storage
  quickMode: boolean; // Skip intros, get straight to recommendations
  theme: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

// Hydration targets from AI
export interface HydrationTarget {
  id?: number;
  date: string; // YYYY-MM-DD format
  baseTarget: number; // oz per day
  currentIntake: number; // oz consumed so far
  deficit: number; // oz remaining
  fireVsIce: 'fire' | 'ice' | 'balanced'; // Sauna vs Ice bath recommendation
  products: string[]; // Recommended product IDs
  createdAt: Date;
  updatedAt: Date;
}

// Quiz responses for AI context
export interface QuizResponse {
  id?: number;
  question: string;
  answer: string;
  category: 'health' | 'lifestyle' | 'goals' | 'preferences';
  createdAt: Date;
}

// Hydration plans from completed purchases
export interface HydrationPlan {
  id?: number;
  planId: string; // Cart ID that became plan ID
  orderId?: string; // Link to Supabase order
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    timing?: string;
    dosage?: string;
    frequency?: string;
  }>;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (typically 3 days later)
  totalSodium: number; // mg planned
  totalPotassium: number; // mg planned
  totalFluid: number; // ml planned
  userFeedback?: string; // Optional user comments
  createdAt: Date;
}

// Consumption logs linked to plans
export interface ConsumptionLog {
  id?: number;
  planId: string; // Links to HydrationPlan.planId
  timestamp: string; // ISO datetime
  foodItem: string;
  sodiumMg: number;
  potassiumMg: number;
  proteinG: number;
  fluidMl: number;
  source: 'user_reported' | 'product_consumed';
  createdAt: Date;
}

// Owned products from purchases (for coaching restrictions)
export interface OwnedProduct {
  id?: number;
  productId: string;
  name: string;
  description?: string;
  purchaseDate: Date;
  orderId?: string;
  standardInstructions: {
    timing: string;
    dosage: string;
    frequency: string;
    contraindications?: string[];
    venueIntegration?: string; // How this fits with venue systems
  };
  isActive: boolean;
  expiryDate?: Date; // Optional expiry for time-sensitive products
  createdAt: Date;
}

// Define the database
class WaterBarDB extends Dexie {
  profile!: Table<UserProfile>;
  settings!: Table<UserSettings>;
  targets!: Table<HydrationTarget>;
  quiz!: Table<QuizResponse>;
  owned_products!: Table<OwnedProduct>;
  hydration_plans!: Table<HydrationPlan>;
  consumption_logs!: Table<ConsumptionLog>;

  constructor() {
    super('WaterBarDB');
    
    this.version(2).stores({
      profile: '++id, nickname, createdAt',
      settings: '++id, createdAt',
      targets: '++id, date, createdAt',
      quiz: '++id, category, createdAt',
      owned_products: '++id, productId, purchaseDate, isActive, createdAt',
      hydration_plans: '++id, planId, orderId, startDate, createdAt',
      consumption_logs: '++id, planId, timestamp, source, createdAt'
    });
  }
}

// Create database instance
export const db = new WaterBarDB();

// Helper functions
export const profileHelpers = {
  // Calculate Lean Body Mass
  calculateLBM(weight: number, bodyType: string): number {
    const bodyFatPercentages = {
      athletic: 0.15,
      average: 0.25,
      larger: 0.35,
      petite: 0.22,
      powerlifter: 0.12,  // Very low body fat, high muscle mass
      runner: 0.18,       // Low body fat, lean build
      swimmer: 0.16,      // Low body fat, balanced muscle
      dancer: 0.20,       // Lean and toned
      couch_potato: 0.40  // Higher body fat percentage 🛋️
    };
    
    const bodyFat = bodyFatPercentages[bodyType as keyof typeof bodyFatPercentages] || 0.25;
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
    
    // Calculate LBM if weight and bodyType provided
    let lbm = data.lbm;
    if (data.weight && data.bodyType && !lbm) {
      lbm = this.calculateLBM(data.weight, data.bodyType);
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
        bodyType: data.bodyType || 'average',
        lbm,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('🔧 CREATE result ID:', id);
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
        baseTarget: data.baseTarget || 64,
        currentIntake: data.currentIntake || 0,
        deficit: data.deficit || 64,
        fireVsIce: data.fireVsIce || 'balanced',
        products: data.products || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
};

export const ownedProductsHelpers = {
  // Add products from a completed order
  async addFromOrder(orderItems: any[], orderId?: string): Promise<void> {
    for (const item of orderItems) {
      // Get standard instructions from product data (would come from Supabase)
      const standardInstructions = {
        timing: item.timing || 'As needed',
        dosage: item.dosage || 'Follow label instructions',
        frequency: item.frequency || 'Daily',
        contraindications: item.contraindications || [],
        venueIntegration: item.venueIntegration || ''
      };

      await db.owned_products.add({
        productId: item.product_id || item.id,
        name: item.name,
        description: item.description,
        purchaseDate: new Date(),
        orderId,
        standardInstructions,
        isActive: true,
        createdAt: new Date()
      });
    }
  },

  // Get all active owned products
  async getActiveProducts(): Promise<OwnedProduct[]> {
    return await db.owned_products.where('isActive').equals(1).toArray();
  },

  // Check if user owns a specific product
  async ownsProduct(productId: string): Promise<boolean> {
    const products = await db.owned_products
      .where('productId').equals(productId)
      .and(product => product.isActive)
      .toArray();
    return products.length > 0;
  },

  // Get owned product with instructions
  async getProductInstructions(productId: string): Promise<OwnedProduct | null> {
    const products = await db.owned_products
      .where('productId').equals(productId)
      .and(product => product.isActive)
      .toArray();
    return products.length > 0 ? products[0] : null;
  },

  // Deactivate a product (mark as consumed/expired)
  async deactivateProduct(productId: string): Promise<void> {
    await db.owned_products.where('productId').equals(productId).modify({ isActive: false });
  }
};

export const planHelpers = {
  // Save a hydration plan from completed purchase
  async savePlan(planData: Omit<HydrationPlan, 'id' | 'createdAt'>): Promise<void> {
    await db.hydration_plans.add({
      ...planData,
      createdAt: new Date()
    });
  },

  // Get all user's plans
  async getAllPlans(): Promise<HydrationPlan[]> {
    return await db.hydration_plans.orderBy('createdAt').reverse().toArray();
  },

  // Get recent plans for comparison
  async getRecentPlans(limit: number = 3): Promise<HydrationPlan[]> {
    return await db.hydration_plans.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  // Add user feedback to a plan
  async addPlanFeedback(planId: string, feedback: string): Promise<void> {
    await db.hydration_plans.where('planId').equals(planId).modify({ userFeedback: feedback });
  }
};

export const consumptionHelpers = {
  // Log consumption event
  async logConsumption(logData: Omit<ConsumptionLog, 'id' | 'createdAt'>): Promise<void> {
    await db.consumption_logs.add({
      ...logData,
      createdAt: new Date()
    });
  },

  // Get consumption logs for a specific plan
  async getLogsForPlan(planId: string): Promise<ConsumptionLog[]> {
    return await db.consumption_logs.where('planId').equals(planId).toArray();
  },

  // Get consumption logs for date range
  async getLogsForDateRange(startDate: string, endDate: string): Promise<ConsumptionLog[]> {
    return await db.consumption_logs
      .where('timestamp')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  // Get daily totals for a plan
  async getDailyTotals(planId: string, date: string): Promise<{
    sodium: number;
    potassium: number;
    protein: number;
    fluid: number;
  }> {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    
    const logs = await db.consumption_logs
      .where('planId').equals(planId)
      .and(log => log.timestamp >= startOfDay && log.timestamp <= endOfDay)
      .toArray();

    return logs.reduce((totals, log) => ({
      sodium: totals.sodium + log.sodiumMg,
      potassium: totals.potassium + log.potassiumMg,
      protein: totals.protein + log.proteinG,
      fluid: totals.fluid + log.fluidMl
    }), { sodium: 0, potassium: 0, protein: 0, fluid: 0 });
  }
};
