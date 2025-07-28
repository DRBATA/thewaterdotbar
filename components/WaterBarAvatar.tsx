'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio, VideoTrack, useVoiceAssistant, useRemoteParticipants, ParticipantTile, useDataChannel } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';



interface WaterBarAvatarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaterBarAvatar({ isOpen, onClose }: WaterBarAvatarProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    roomName: string;
    participantToken: string;
  } | null>(null);

  // Fetch connection details
  const refreshConnectionDetails = async () => {
    try {
      const response = await fetch('/api/avatar-connection');
      if (response.ok) {
        const details = await response.json();
        setConnectionDetails(details);
      }
    } catch (error) {
      console.error('Failed to get connection details:', error);
    }
  };

  // Initialize connection details on mount
  useEffect(() => {
    if (isOpen && !connectionDetails) {
      refreshConnectionDetails();
    }
  }, [isOpen, connectionDetails]);

  // Handle room events
  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      setIsConnecting(false);
      refreshConnectionDetails();
    };
    
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room]);

  // Connect to room
  const startSession = async () => {
    if (!connectionDetails) return;
    
    setIsConnecting(true);
    try {
      await Promise.all([
        room.localParticipant.setMicrophoneEnabled(true),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
      ]);
      setSessionStarted(true);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from room
  const endSession = async () => {
    await room.disconnect();
    onClose();
  };

  // Toggle mute
  const toggleMute = async () => {
    const newMutedState = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMutedState);
    setIsMuted(newMutedState);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 md:w-96 md:h-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Enable audio for voice chat" />
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h3 className="font-semibold">Water Bar Hydration Coach</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700"
          >
            ×
          </Button>
        </div>

        {/* Avatar Video Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center h-64 md:h-48">
          {!sessionStarted ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-4">Ready to chat with your hydration coach?</p>
              <Button 
                onClick={startSession} 
                disabled={isConnecting || !connectionDetails}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? 'Connecting...' : 'Talk to Coach'}
              </Button>
            </div>
          ) : (
            <div className="w-full h-full bg-black relative">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm">Connected! Your coach is speaking...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Transcript (Mobile-First) */}
        {sessionStarted && (
          <div className="h-20 bg-gray-50 border-t overflow-y-auto p-2">
            <div className="text-xs text-gray-600">
              <div className="mb-1">
                <span className="font-semibold text-blue-600">Coach:</span> Hello! I'm your personal hydration coach. Tell me about your activity level and what you're looking to achieve today.
              </div>
              <div className="mb-1">
                <span className="font-semibold text-green-600">You:</span> I'm going to the gym later
              </div>
              <div className="mb-1">
                <span className="font-semibold text-blue-600">Coach:</span> Perfect! Let me create your hydration plan...
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {sessionStarted && (
          <div className="p-3 bg-gray-50 flex justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className={isMuted ? 'bg-red-100 border-red-300' : ''}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={endSession}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        )}
      </RoomContext.Provider>
    </div>
  );
}
