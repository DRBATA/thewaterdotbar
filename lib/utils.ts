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
  textStream: TextStreamData,
  room: Room
): ReceivedChatMessage {
  return {
    id: textStream.streamInfo.id,
    timestamp: textStream.streamInfo.timestamp,
    message: textStream.text,
    from:
      textStream.participantInfo.identity === room.localParticipant.identity
        ? room.localParticipant
        : Array.from(room.remoteParticipants.values()).find(
            (p) => p.identity === textStream.participantInfo.identity
          ),
  };
}
