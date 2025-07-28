"use client";

import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { ConnectionDetails } from "@/app/api/avatar-connection/route";

export default function HydrationCoachAvatar() {
  const [room] = useState(new Room());

  const onConnectButtonClicked = useCallback(async () => {
    try {
      // Get session ID from cookies to synchronize with cart
      const getSessionId = () => {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('sb_session_id='));
        return sessionCookie ? sessionCookie.split('=')[1] : null;
      };
      
      const sessionId = getSessionId();
      const url = new URL("/api/avatar-connection", window.location.origin);
      
      // Pass session ID as query parameter if available
      if (sessionId) {
        url.searchParams.set('session_id', sessionId);
        console.log('🎯 AVATAR: Passing session_id to agent:', sessionId);
      }
      
      const response = await fetch(url.toString());
      const connectionDetailsData: ConnectionDetails = await response.json();

      await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      console.error("Failed to connect to avatar:", error);
    }
  }, [room]);

  useEffect(() => {
    const onDeviceFailure = (error: Error) => {
      console.error("Media device error:", error);
    };

    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <RoomContext.Provider value={room}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} />
        </div>
      </RoomContext.Provider>
    </div>
  );
}

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <>
      <AnimatePresence mode="wait">
        {agentState === "disconnected" ? (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="p-4 text-center"
          >
            <div className="mb-3">
              <h3 className="font-semibold text-gray-800">Hydration Coach</h3>
              <p className="text-sm text-gray-600">Get personalized hydration advice</p>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              onClick={() => props.onConnectButtonClicked()}
            >
              <Mic size={16} />
              Talk to Coach
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="w-80 h-96"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 bg-gray-100 relative">
                <AgentVisualizer />
              </div>
              <div className="p-3 bg-white border-t">
                <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <RoomAudioRenderer />
    </>
  );
}

function AgentVisualizer() {
  const { agent } = useVoiceAssistant();

  return (
    <div className="flex items-center justify-center h-full">
      {agent && agent.videoTrack ? (
        <VideoTrack
          trackRef={agent.videoTrack}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Mic size={24} className="text-teal-600" />
          </div>
          <p className="text-sm">Connecting to your coach...</p>
        </div>
      )}
    </div>
  );
}

function ControlBar(props: { onConnectButtonClicked: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {audioTrack && (
          <BarVisualizer
            state={state}
            trackRef={audioTrack}
            barCount={5}
            options={{ minHeight: 8, maxHeight: 24 }}
            className="text-teal-600"
          />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <VoiceAssistantControlBar />
        <DisconnectButton className="p-2 text-gray-500 hover:text-gray-700">
          <MicOff size={16} />
        </DisconnectButton>
      </div>
    </div>
  );
}
