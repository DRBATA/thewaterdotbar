/**
 * GPS Consent Sync - Frontend utility to push Dexie GPS consent to backend
 * This bridges the gap between browser IndexedDB and server-side agent access
 */

import { db } from './dexie-db';

/**
 * Read GPS consent from Dexie settings table
 */
export async function readGpsConsentFromDexie(): Promise<boolean> {
  try {
    const settings = await db.settings.get(1);
    return settings?.gpsConsent ?? false;
  } catch (error) {
    console.error('❌ Failed to read GPS consent from Dexie:', error);
    return false;
  }
}

/**
 * Sync GPS consent from Dexie to backend bridge
 * Call this on app load, login, or when consent changes
 */
export async function syncGpsConsentToBackend(): Promise<boolean> {
  try {
    // Read current consent from Dexie
    const gpsConsent = await readGpsConsentFromDexie();
    
    console.log(`📍 GPS_SYNC: Syncing consent to backend: ${gpsConsent}`);
    
    // POST to backend bridge
    const response = await fetch('/api/bridge/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({ gpsConsent })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ GPS_SYNC: Successfully synced for user ${result.userId}`);
      return true;
    } else {
      console.error(`❌ GPS_SYNC: Backend returned ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ GPS_SYNC: Failed to sync consent:', error);
    return false;
  }
}

/**
 * Auto-sync GPS consent when it changes in Dexie
 * Call this after updating settings in the UI
 */
export async function updateGpsConsentAndSync(newConsent: boolean): Promise<boolean> {
  try {
    // Update Dexie first
    await db.settings.put({
      id: 1,
      gpsConsent: newConsent,
      dataStorageConsent: true, // Keep existing values
      quickMode: false,
      theme: 'light',
      createdAt: new Date()
    });
    
    console.log(`📍 GPS_UPDATE: Updated Dexie consent to ${newConsent}`);
    
    // Then sync to backend
    return await syncGpsConsentToBackend();
    
  } catch (error) {
    console.error('❌ GPS_UPDATE: Failed to update and sync:', error);
    return false;
  }
}
