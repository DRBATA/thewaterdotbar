import { db, settingsHelpers } from './dexie-db';

/**
 * Sync GPS consent from Dexie to bridge API
 * Called whenever GPS consent changes in the frontend
 */
export async function syncGpsConsentToBridge(): Promise<void> {
  try {
    // Get current GPS consent from Dexie
    const settings = await settingsHelpers.getOrCreateSettings();
    const gpsConsent = settings.gpsConsent;
    
    console.log(`🔄 GPS_SYNC: Syncing consent to bridge: ${gpsConsent}`);
    
    // Send to bridge API
    const response = await fetch('/api/bridge/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gpsConsent }),
    });
    
    if (!response.ok) {
      throw new Error(`Bridge sync failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ GPS_SYNC: Bridge updated for ${result.userId}: ${result.gpsConsent}`);
    
  } catch (error) {
    console.error('❌ GPS_SYNC: Failed to sync consent to bridge:', error);
  }
}

/**
 * Initialize GPS consent sync on page load
 */
export async function initializeGpsBridgeSync(): Promise<void> {
  // Sync current state immediately
  await syncGpsConsentToBridge();
  
  // Set up listener for future changes
  db.settings.hook('updating', function (modifications: any, primKey: any, obj: any, trans: any) {
    if ('gpsConsent' in modifications) {
      console.log(`🔄 GPS_SYNC: GPS consent changed to ${modifications.gpsConsent}`);
      // Sync after transaction completes
      trans.on('complete', () => {
        syncGpsConsentToBridge();
      });
    }
  });
  
  console.log('🎯 GPS_SYNC: Bridge sync initialized');
}
