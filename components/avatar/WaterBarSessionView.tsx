'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type AgentState,
  useRoomContext,
  useVoiceAssistant,
  VideoTrack,
} from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, X, Droplets } from 'lucide-react';
import { useChatAndTranscription } from '@/hooks/useChatAndTranscription';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface WaterBarSessionViewProps {
  sessionStarted: boolean;
  onEndSession: () => void;
}

export const WaterBarSessionView = ({ sessionStarted, onEndSession }: WaterBarSessionViewProps) => {
  const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();
  
  // Get agent participant and video track
  const agentParticipant = room.remoteParticipants.find(p => !p.isLocal);
  const videoPublication = agentParticipant?.videoTrackPublications.values().next().value;
  const videoTrack = videoPublication?.track;

  // Local participant controls
  const localParticipant = room.localParticipant;
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = async () => {
    const enabled = !isMuted;
    await localParticipant.setMicrophoneEnabled(enabled);
    setIsMuted(!enabled);
  };

  async function handleSendMessage(message: string) {
    await send(message);
  }

  // Auto-scroll chat messages
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Hydration Coach</h2>
            <p className="text-sm text-gray-600">
              {agentState === 'speaking' ? 'Speaking...' : 
               agentState === 'listening' ? 'Listening...' : 
               agentState === 'thinking' ? 'Thinking...' : 'Connected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="text-gray-600"
          >
            {chatOpen ? 'Hide Chat' : 'Show Chat'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEndSession}
            className="text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Avatar video section */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black/5 flex items-center justify-center">
            {videoTrack && videoPublication ? (
              <VideoTrack 
                trackRef={{ 
                  participant: agentParticipant!, 
                  publication: videoPublication,
                  source: videoTrack.source 
                }}
                className="w-full h-full object-cover rounded-lg max-w-md max-h-96"
              />
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-600">
                  {agentState === 'speaking' ? 'Coach is speaking...' : 
                   agentState === 'listening' ? 'Listening...' : 
                   agentState === 'thinking' ? 'Thinking...' : 'Connecting to video...'}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={toggleMute}
                className="rounded-full w-12 h-12"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="destructive"
                size="lg"
                onClick={onEndSession}
                className="rounded-full w-12 h-12"
              >
                <Phone className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-2">
              {isMuted ? 'Tap to unmute' : 'Speak naturally to your coach'}
            </p>
          </div>
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-l border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Conversation</h3>
              </div>
              
              <div 
                id="chat-messages"
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((message, index) => (
                  <div 
                    key={`${message.id || 'msg'}-${index}-${message.timestamp || Date.now()}`}
                    className={`flex ${message.from?.isLocal ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.from?.isLocal 
                        ? 'bg-teal-500 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
