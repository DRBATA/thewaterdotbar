import Dexie, { type Table } from 'dexie';

// Defines the structure of the user's profile data
export interface UserProfile {
  id?: number; // Primary key, auto-incrementing
  nickname?: string;
  weightKg?: number;
  // Enum for activity level, ensures data consistency
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  // A number between 0 and 1, representing the AI's estimate from conversation
  estimatedBodyFatPercentage?: number;
  leanBodyMassKg?: number;
  dailyWaterTargetMl?: number;
  dailySodiumTargetMg?: number;
  dailyPotassiumTargetMg?: number;
  dailyProteinTargetG?: number;
  // Sex is often a factor in metabolic calculations
  sex?: 'male' | 'female';
  updatedAt: Date; // To track when the profile was last changed
}

// This class is the main interface to the local browser database
class ClientDB extends Dexie {
  // Defines the 'userProfile' table with the structure from the interface above
  userProfile!: Table<UserProfile>;

  constructor() {
    // The name of the database in the browser's IndexedDB
    super('TheWaterBarDatabase');
    this.version(1).stores({
      // Defines the schema for version 1 of our database.
      // '++id' means 'id' is the primary key and will auto-increment.
      // 'updatedAt' is an index to allow for efficient querying.
      userProfile: '++id, updatedAt',
    });
  }

  // --- Profile Methods ---

  /**
   * Retrieves the most recently updated user profile.
   * Since we only ever want one profile, we get the last one sorted by update time.
   */
  async getProfile(): Promise<UserProfile | undefined> {
    return this.userProfile.orderBy('updatedAt').last();
  }

  /**
   * Saves or updates the user profile.
   * If a profile exists, it updates it. If not, it creates a new one.
   * Ensures there is only ever one profile document.
   */
  async saveProfile(profileData: Partial<UserProfile>): Promise<void> {
    const existingProfile = await this.getProfile();
    const dataToSave = {
      ...existingProfile,
      ...profileData,
      updatedAt: new Date(),
    };

    if (existingProfile?.id) {
      // If a profile exists, update it using its primary key
      await this.userProfile.put(dataToSave, existingProfile.id);
    } else {
      // If no profile exists, add a new one
      await this.userProfile.add(dataToSave as UserProfile);
    }
  }
}

// Export a single instance of the database client for use throughout the app
export const db = new ClientDB();
