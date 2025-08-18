import { NextRequest, NextResponse } from 'next/server';
import { planHelpers } from '@/lib/dexie-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEXIE-BRIDGE: Getting plans data for agent...');
    
    // Get hydration plans from Dexie using the correct helper
    const plans = await planHelpers.getRecentPlans();
    
    console.log('🔍 DEXIE-BRIDGE: Plans data:', plans);
    
    return NextResponse.json(plans || []);
  } catch (error) {
    console.error('🔍 DEXIE-BRIDGE: Error getting plans:', error);
    return NextResponse.json({ error: 'Failed to get plans' }, { status: 500 });
  }
}
