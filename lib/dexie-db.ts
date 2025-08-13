import Dexie, { Table } from 'dexie';

// Profile data structure
export interface UserProfile {
  id?: number;
  nickname: string;
  weight: number; // in lbs
  bodyType: 'athletic' | 'average' | 'larger' | 'petite';
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

// Define the database
class WaterBarDB extends Dexie {
  profile!: Table<UserProfile>;
  settings!: Table<UserSettings>;
  targets!: Table<HydrationTarget>;
  quiz!: Table<QuizResponse>;

  constructor() {
    super('WaterBarDB');
    
    this.version(1).stores({
      profile: '++id, nickname, createdAt',
      settings: '++id, createdAt',
      targets: '++id, date, createdAt',
      quiz: '++id, category, createdAt'
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
      petite: 0.22
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
    
    // Calculate LBM if weight and bodyType provided
    let lbm = data.lbm;
    if (data.weight && data.bodyType && !lbm) {
      lbm = this.calculateLBM(data.weight, data.bodyType);
    }
    
    if (existing) {
      // Update existing
      await db.profile.update(existing.id!, {
        ...data,
        lbm,
        updatedAt: new Date()
      });
    } else {
      // Create new
      await db.profile.add({
        nickname: data.nickname || '',
        weight: data.weight || 150,
        bodyType: data.bodyType || 'average',
        lbm,
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
