import Dexie from 'dexie';

// Define the database schema
export interface UserProfile {
  id?: number; // Primary key, auto-incrementing
  nickname?: string;
  bodyType?: string; // e.g., 'athletic', 'average', 'slim'
  activityLevel?: string; // e.g., 'sedentary', 'moderate', 'high'
  weight?: number; // in kg
  lastUpdated?: Date;
}

export interface HydrationPlan {
  water: number; // mL
  sodium: number; // mg
  potassium: number; // mg
  protein: number; // g
}

// Specific data structures for each event type, informed by our architecture
export interface ConsumptionData {
  productName: string;
  productId?: string; // Optional: link back to Supabase `hydration_options` table
  quantity: number;
  unit: 'ml' | 'g' | 'serving' | 'sachet';
  nutrients: {
    water_ml: number;
    sodium_mg: number;
    potassium_mg: number;
    protein_g: number;
  };
}

export interface ActivityData {
  activityName: string;
  duration_minutes: number;
  intensity: 'light' | 'moderate' | 'high' | 'heavy';
}

// A more robust, type-safe TimelineEvent that uses discriminated unions
export interface TimelineEvent {
  id?: number;
  timestamp: Date; // For completed events, this is when it happened. For planned, when it should happen.
  isCompleted: boolean; // true for logged events, false for scheduled/planned events.
  description: string; // e.g., "Drank YALA Kombucha" or "Morning: Rite Gut Health"
  
  // New flags for notifications and genetic algorithm input
  notificationEnabled: boolean; // User preference for reminders on planned events
  entryType: 'user_logged' | 'ai_suggested'; // Distinguishes user entries from AI plans

  // "Fused-summed" KPIs for this single atomic event.
  kpi_water_ml: number;
  kpi_sodium_mg: number;
  kpi_potassium_mg: number;
  kpi_protein_g: number;
}

class WaterBarDatabase extends Dexie {
  userProfile: Dexie.Table<UserProfile, number>;
  timelineEvents: Dexie.Table<TimelineEvent, number>;

  constructor() {
    super('WaterBarDatabase');
    
    // Version 5 adds notification and entryType flags for advanced features.
    this.version(5).stores({
      userProfile: '++id, nickname, bodyType, activityLevel, weight, lastUpdated',
      timelineEvents: '++id, timestamp, isCompleted, entryType, notificationEnabled',
    });

    // Define typed tables
    this.userProfile = this.table('userProfile');
    this.timelineEvents = this.table('timelineEvents');
  }

  // Helper method to get the primary user profile (we'll just use a single profile for now)
  async getPrimaryProfile(): Promise<UserProfile | undefined> {
    return await this.userProfile.get(1);
  }

  // Helper method to save or update the user profile
  async saveProfile(profile: UserProfile): Promise<number> {
    // Always use ID 1 for the primary profile
    profile.id = 1;
    profile.lastUpdated = new Date();
    return await this.userProfile.put(profile);
  }

  // Helper to save just the nickname
  async saveNickname(nickname: string): Promise<number> {
    const existing = await this.getPrimaryProfile() || {};
    return await this.saveProfile({
      ...existing,
      nickname
    });
  }

  // Helper to save just the weight
  async saveWeight(weight: number): Promise<number> {
    const existing = await this.getPrimaryProfile() || {};
    return await this.saveProfile({ ...existing, weight });
  }

  // Helper to save just the activity level
  async saveActivityLevel(activityLevel: string): Promise<number> {
    const existing = await this.getPrimaryProfile() || {};
    return await this.saveProfile({ ...existing, activityLevel });
  }

  // Helper to save just the body type
  async saveBodyType(bodyType: string): Promise<number> {
    const existing = await this.getPrimaryProfile() || {};
    return await this.saveProfile({ ...existing, bodyType });
  }

  // --- Hydration Plan Calculation ---

  calculateHydrationPlan(profile: UserProfile): HydrationPlan | null {
    if (!profile.weight || !profile.bodyType || !profile.activityLevel) {
      return null; // Not enough data to calculate
    }

    // Step 1: Estimate Body Fat %
    // Using male values as a default for now. This can be expanded to ask for gender.
    const bodyFatMap: { [key: string]: number } = {
      'shredded': 8,
      'athletic': 12.5,
      'lean': 12.5,
      'fit': 17.5,
      'average': 22.5,
      'extra': 27.5, // carrying extra weight
      'overweight': 32.5,
    };
    const bodyFatPercentage = bodyFatMap[profile.bodyType.toLowerCase()] || 22.5; // Default to average

    // Step 2: Calculate LBM
    const lbm = profile.weight * (1 - (bodyFatPercentage / 100));

    // Step 3: Calculate Baseline Needs
    let water = 35 * lbm;
    let sodium = 24 * lbm;
    let potassium = 72 * lbm;
    let protein = 1.3 * lbm;

    // Step 4: Activity & Sweat Adjustment
    const sweatLossMap: { [key: string]: number } = {
      'sedentary': 0,
      'light': 0.4,
      'moderate': 0.8,
      'high': 1.5,
      'heavy': 1.5,
    };
    const sweatLossLiters = sweatLossMap[profile.activityLevel.toLowerCase()] || 0;

    if (sweatLossLiters > 0) {
      water += 1000 * sweatLossLiters;
      sodium += 700 * sweatLossLiters;
      potassium += 350 * sweatLossLiters;
    }

    // Step 5: Protein Adjustment for Activity
    const proteinMultiplierMap: { [key: string]: number } = {
      'moderate': 1.6,
      'high': 1.8,
      'heavy': 1.8,
    };
    const proteinMultiplier = proteinMultiplierMap[profile.activityLevel.toLowerCase()];
    if (proteinMultiplier) {
      protein = proteinMultiplier * lbm;
    }

    return {
      water: Math.round(water),
      sodium: Math.round(sodium),
      potassium: Math.round(potassium),
      protein: Math.round(protein),
    };
  }

  // --- Timeline Event Management ---

  // Log a new event to the timeline
  async logTimelineEvent(event: Omit<TimelineEvent, 'id'>): Promise<number> {
    return await this.timelineEvents.add(event as TimelineEvent);
  }

  // Get timeline events since a certain date
  async getTimelineEvents(since: Date): Promise<TimelineEvent[]> {
    return await this.timelineEvents.where('timestamp').aboveOrEqual(since).toArray();
  }

  // Get all timeline events (for debugging or full history views)
  async getAllTimelineEvents(): Promise<TimelineEvent[]> {
    return await this.timelineEvents.toArray();
  }
}

// Create a singleton instance
const db = new WaterBarDatabase();

export default db;
