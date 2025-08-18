import { NextRequest, NextResponse } from 'next/server';
import { profileHelpers } from '@/lib/dexie-db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEXIE-BRIDGE: Getting profile data for agent...');
    
    // Get profile from Dexie
    const profile = await profileHelpers.getOrCreateProfile();
    
    console.log('🔍 DEXIE-BRIDGE: Profile data:', profile);
    
    if (profile) {
      return NextResponse.json({
        id: profile.id,
        nickname: profile.nickname,
        weight: profile.weight,
        bodyType: profile.bodyType,
        lbm: profile.lbm,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      });
    } else {
      return NextResponse.json(null, { status: 404 });
    }
  } catch (error) {
    console.error('🔍 DEXIE-BRIDGE: Error getting profile:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
