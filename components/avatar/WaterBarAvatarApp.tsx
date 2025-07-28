'use client';

import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'framer-motion';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { WaterBarSessionView } from './WaterBarSessionView';
import { WaterBarWelcome } from './WaterBarWelcome';

const MotionWelcome = motion(WaterBarWelcome);
const MotionSessionView = motion(WaterBarSessionView);

interface WaterBarAvatarAppProps {
  onClose?: () => void;
}

export function WaterBarAvatarApp({ onClose }: WaterBarAvatarAppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  // Fetch connection details from our API
  const refreshConnectionDetails = async () => {
    try {
      const response = await fetch('/api/avatar-connection');
      const details = await response.json();
      setConnectionDetails(details);
    } catch (error) {
      console.error('Failed to get connection details:', error);
    }
  };

  useEffect(() => {
    refreshConnectionDetails();
  }, []);

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    
    const onMediaDevicesError = (error: Error) => {
      console.error('Media devices error:', error);
    };
    
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected' && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).catch((error) => {
        if (!aborted) {
          console.error('Failed to connect:', error);
        }
        toast.error(`Connection error: ${error.name}: ${error.message}`);
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, connectionDetails]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Welcome Screen */}
        <MotionWelcome
          key="welcome"
          startButtonText={appConfig.startButtonText}
          onStartCall={() => setSessionStarted(true)}
          disabled={sessionStarted}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionStarted ? 0 : 1 }}
          transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
        />

        {/* Avatar Session */}
        <RoomContext.Provider value={room}>
          <RoomAudioRenderer />
          <StartAudio label="Enable audio for voice chat" />
          <MotionSessionView
            key="session-view"
            appConfig={appConfig}
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            initial={{ opacity: 0 }}
            animate={{ opacity: sessionStarted ? 1 : 0 }}
            transition={{
              duration: 0.5,
              ease: 'linear',
              delay: sessionStarted ? 0.5 : 0,
            }}
          />
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              sessionStarted={sessionStarted}
              onEndSession={handleEndSession}
            />
          )}
        </RoomContext.Provider>
      </div>
    </div>
  );
}
