import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Room } from 'livekit-client';
import type { ReceivedChatMessage, TextStreamData } from '@livekit/components-react';

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} AED`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert transcription to chat message format for LiveKit
export function transcriptionToChatMessage(
  transcription: TextStreamData,
  room: Room
): ReceivedChatMessage {
  return {
    id: `transcription-${transcription.id || Date.now()}`,
    message: transcription.text,
    timestamp: Date.now(),
    from: {
      identity: transcription.participant?.identity || 'agent',
      name: transcription.participant?.name || 'Hydration Coach',
      isLocal: false,
    },
  };
}
