import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple in-memory storage for profile data (replace with your DB)
type ProfileRecord = { 
  userId: string; 
  nickname: string;
  weight: number;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  bodyType: string;
  lbm?: number;
  updatedAt: string; 
};

const profileStore = new Map<string, ProfileRecord>();

function setCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigins = [
    'https://thewaterbar.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Headers', 'content-type,x-agent-key');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
}

export async function OPTIONS(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  setCorsHeaders(req, res);
  return res;
}

/**
 * POST /api/bridge/profile
 * Called by FRONTEND to store profile data from Dexie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname, weight, gender, bodyType, lbm } = body;
    
    if (!nickname || !weight || !gender || !bodyType) {
      return NextResponse.json(
        { error: 'Missing required profile fields' }, 
        { status: 400 }
      );
    }

    // Simple session identification (replace with real auth)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    
    const record: ProfileRecord = {
      userId: sessionId,
      nickname,
      weight,
      gender,
      bodyType,
      lbm,
      updatedAt: new Date().toISOString()
    };
    
    profileStore.set(sessionId, record);
    
    console.log(`👤 PROFILE_BRIDGE: Stored profile for ${sessionId}: ${nickname}`);
    
    const res = NextResponse.json({ 
      success: true, 
      userId: sessionId,
      nickname,
      updatedAt: record.updatedAt
    });
    
    setCorsHeaders(req, res);
    return res;
    
  } catch (error) {
    console.error('❌ PROFILE_BRIDGE POST error:', error);
    return NextResponse.json(
      { error: 'Failed to store profile data' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/bridge/profile?userId=X
 * Called by AGENT to retrieve profile data
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const agentKey = req.headers.get('x-agent-key');
    
    // Agent authentication
    if (agentKey !== process.env.AGENT_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized agent access' }, 
        { status: 401 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' }, 
        { status: 400 }
      );
    }
    
    const record = profileStore.get(userId);
    
    if (!record) {
      console.log(`👤 PROFILE_BRIDGE: No profile found for ${userId}`);
      
      const res = NextResponse.json(
        { error: 'Profile not found' }, 
        { status: 404 }
      );
      setCorsHeaders(req, res);
      return res;
    }
    
    console.log(`👤 PROFILE_BRIDGE: Retrieved profile for ${userId}: ${record.nickname}`);
    
    const res = NextResponse.json(record);
    setCorsHeaders(req, res);
    return res;
    
  } catch (error) {
    console.error('❌ PROFILE_BRIDGE GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile data' }, 
      { status: 500 }
    );
  }
}
