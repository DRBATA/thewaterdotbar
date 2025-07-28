import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// LiveKit connection details from environment variables
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// Don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query params or headers
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id') || request.headers.get('x-session-id');
    
    // Debug logging
    console.log("LIVEKIT_URL:", LIVEKIT_URL);
    console.log("LIVEKIT_API_KEY:", API_KEY ? "SET" : "MISSING");
    console.log("LIVEKIT_API_SECRET:", API_SECRET ? "SET" : "MISSING");
    console.log("SESSION_ID:", sessionId);
    
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Generate participant token with session ID embedded in room name
    const participantIdentity = `hydration_coach_user_${crypto.randomUUID()}`;
    const roomName = sessionId 
      ? `hydration_coach_room_${sessionId}` 
      : `hydration_coach_room_${crypto.randomUUID()}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*", // Allow all origins for avatar frontend
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
      "Access-Control-Allow-Credentials": "true",
    });
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("Error generating connection details:", error);
    return NextResponse.json(
      { error: "Failed to generate connection details" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Credentials": "true",
  });
  
  return new Response(null, { status: 200, headers });
}

async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = "5m";
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return await at.toJwt();
}
