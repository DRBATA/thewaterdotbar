import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple in-memory storage for GPS consent (replace with your DB)
type ConsentRecord = { 
  userId: string; 
  gpsConsent: boolean; 
  updatedAt: string; 
};

const consentStore = new Map<string, ConsentRecord>();

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
 * POST /api/bridge/settings
 * Called by FRONTEND to store GPS consent from Dexie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gpsConsent } = body;
    
    if (typeof gpsConsent !== 'boolean') {
      return NextResponse.json(
        { error: 'gpsConsent must be boolean' }, 
        { status: 400 }
      );
    }

    // Simple session identification (replace with real auth)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    
    const record: ConsentRecord = {
      userId: sessionId,
      gpsConsent,
      updatedAt: new Date().toISOString()
    };
    
    consentStore.set(sessionId, record);
    
    console.log(`📍 GPS_BRIDGE: Stored consent for ${sessionId}: ${gpsConsent}`);
    
    const res = NextResponse.json({ 
      success: true, 
      userId: sessionId,
      gpsConsent,
      updatedAt: record.updatedAt
    });
    
    setCorsHeaders(req, res);
    return res;
    
  } catch (error) {
    console.error('❌ GPS_BRIDGE POST error:', error);
    return NextResponse.json(
      { error: 'Failed to store GPS consent' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/bridge/settings?userId=X
 * Called by AGENT to retrieve GPS consent
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
    
    const record = consentStore.get(userId);
    
    if (!record) {
      // Default to false if no consent stored
      const defaultRecord: ConsentRecord = {
        userId,
        gpsConsent: false,
        updatedAt: new Date().toISOString()
      };
      
      console.log(`📍 GPS_BRIDGE: No consent found for ${userId}, defaulting to false`);
      
      const res = NextResponse.json(defaultRecord);
      setCorsHeaders(req, res);
      return res;
    }
    
    console.log(`📍 GPS_BRIDGE: Retrieved consent for ${userId}: ${record.gpsConsent}`);
    
    const res = NextResponse.json(record);
    setCorsHeaders(req, res);
    return res;
    
  } catch (error) {
    console.error('❌ GPS_BRIDGE GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GPS consent' }, 
      { status: 500 }
    );
  }
}
