import Dexie, { Table } from 'dexie';

// Profile data structure
export interface UserProfile {
  id?: number;
  nickname: string;
  weight: number; // in lbs
  gender: 'male' | 'female' | 'prefer_not_to_say';
  bodyType: 'shredded' | 'athletic' | 'fit' | 'average' | 'dad_bod' | 'overweight' | 'obese' | 'stocky_muscular' | 'very_athletic' | 'healthy' | 'curvy_soft';
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
  baseTarget: number; // ml per day
  currentIntake: number; // ml consumed so far
  deficit: number; // ml remaining
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

// Removed hydration_plans and consumption_logs - agent can't write to Dexie anyway
// Keeping schema simple: profile, settings, targets only

// Owned products from purchases - simple tracking only
export interface OwnedProduct {
  id?: number;
  productId: string; // References Supabase product with full guidelines
  name: string;
  description?: string;
  purchaseDate: Date;
  orderId?: string;
  
  // Consumption tracking only - AI gets guidelines from Supabase
  consumptions: {
    timestamp: Date;
    amount: string; // What they consumed
    context?: string; // "before breakfast", "post-workout", etc.
  }[];
  
  isActive: boolean;
  expiryDate?: Date;
  createdAt: Date;
}

// Define the database
class WaterBarDB extends Dexie {
  profile!: Table<UserProfile>;
  settings!: Table<UserSettings>;
  targets!: Table<HydrationTarget>;
  quiz!: Table<QuizResponse>;
  owned_products!: Table<OwnedProduct>;

  constructor() {
    super('WaterBarDB');
    
    this.version(3).stores({
      profile: '++id, nickname, createdAt',
      settings: '++id, createdAt',
      targets: '++id, date, createdAt',
      quiz: '++id, category, createdAt',
      owned_products: '++id, productId, purchaseDate, isActive, createdAt'
    });
    
    // Remove hydration_plans and consumption_logs tables
    this.version(2).stores({
      profile: '++id, nickname, createdAt',
      settings: '++id, createdAt',
      targets: '++id, date, createdAt',
      quiz: '++id, category, createdAt',
      owned_products: '++id, productId, purchaseDate, isActive, createdAt',
      hydration_plans: null, // Delete table
      consumption_logs: null  // Delete table
    });
  }
}

// Create database instance
export const db = new WaterBarDB();

// Helper functions
export const profileHelpers = {
  // Calculate Lean Body Mass with gender-specific body fat percentages
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

// Removed planHelpers and consumptionHelpers - keeping schema simple
