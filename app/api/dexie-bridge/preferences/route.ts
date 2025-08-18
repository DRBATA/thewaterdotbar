import { NextRequest, NextResponse } from 'next/server';
import { settingsHelpers } from '@/lib/dexie-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEXIE-BRIDGE: Getting settings/preferences data for agent...');
    
    // Get settings from Dexie
    const settings = await settingsHelpers.getOrCreateSettings();
    
    console.log('🔍 DEXIE-BRIDGE: Settings data:', settings);
    
    if (settings) {
      // Only return fields that actually exist in UserSettings interface
      return NextResponse.json({
        id: settings.id,
        gpsConsent: settings.gpsConsent,
        dataStorageConsent: settings.dataStorageConsent,
        quickMode: settings.quickMode,
        theme: settings.theme,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      });
    } else {
      return NextResponse.json(null, { status: 404 });
    }
  } catch (error) {
    console.error('🔍 DEXIE-BRIDGE: Error getting settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}
