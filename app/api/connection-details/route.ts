import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
}

export async function GET(request: NextRequest) {
  try {
    const roomName = `waterbar-${Math.random().toString(36).substring(7)}`;
    const participantName = `user-${Math.random().toString(36).substring(7)}`;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: participantName,
        ttl: '10m',
      }
    );
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const connectionDetails: ConnectionDetails = {
      serverUrl: process.env.LIVEKIT_URL!,
      roomName,
      participantName,
      participantToken: await at.toJwt(),
    };

    return NextResponse.json(connectionDetails);
  } catch (error) {
    console.error('Error creating connection details:', error);
    return NextResponse.json(
      { error: 'Failed to create connection details' },
      { status: 500 }
    );
  }
}
