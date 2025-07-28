"use client"

import { useState, useEffect, useMemo } from "react"
import { Room, RoomEvent, Track } from 'livekit-client';
import { 
  RoomAudioRenderer, 
  RoomContext, 
  StartAudio,
  useVoiceAssistant,
  useRoomContext,
  useRemoteParticipants,
  VideoTrack,
  useTracks,
  type AgentState
} from '@livekit/components-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, X, Phone, PhoneOff, Mic, MicOff } from "lucide-react"
import useChatAndTranscription from "@/hooks/useChatAndTranscription"
import { cn } from "@/lib/utils"
import { AvatarTile } from '@/components/livekit/avatar-tile';
import { AgentTile } from '@/components/livekit/agent-tile';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

function UnifiedChatAvatarContent({ room }: { room: Room }) {
  const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(true); // Always show chat in our unified view
  const { messages, send } = useChatAndTranscription();
  
  // Use education frontend's track management instead of manual participant finding
  const videoTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const agentVideoTrack = videoTracks.find(track => !track.participant.isLocal);

  async function handleSendMessage(message: string) {
    await send(message);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Avatar Video Section */}
      <div className="h-48 bg-black/20 border-b border-white/20 flex items-center justify-center">
        {agentVideoTrack ? (
          <AvatarTile 
            videoTrack={agentVideoTrack}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/80 text-sm">
              {agentState === 'speaking' ? 'Coach is speaking...' : 
               agentState === 'listening' ? 'Listening...' : 
               agentState === 'thinking' ? 'Thinking...' : 'Connecting to video...'}
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-h-64 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.id || 'msg'}-${index}-${message.timestamp || Date.now()}`} className={`flex ${message.from?.isLocal ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                message.from?.isLocal 
                  ? 'bg-teal-500/80 text-white rounded-br-lg'
                  : 'bg-white/10 text-white/90 rounded-bl-lg'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Agent Controls */}
      <div className="p-4 border-t border-white/20">
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled)}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {room.localParticipant.isMicrophoneEnabled ? (
              <Mic className="w-4 h-4 mr-2" />
            ) : (
              <MicOff className="w-4 h-4 mr-2" />
            )}
            {room.localParticipant.isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => room.disconnect()}
            className="bg-red-500/20 border-red-400/50 text-red-100 hover:bg-red-500/30"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnifiedChatAvatar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const room = useMemo(() => new Room(), []);
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    roomName: string;
    participantToken: string;
  } | null>(null);

  // Fetch connection details
  const refreshConnectionDetails = async () => {
    try {
      // Get session ID from cookies to synchronize with cart
      const getSessionId = () => {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('sb_session_id='));
        return sessionCookie ? sessionCookie.split('=')[1] : null;
      };
      
      const sessionId = getSessionId();
      const url = new URL('/api/avatar-connection', window.location.origin);
      
      // Pass session ID as query parameter if available
      if (sessionId) {
        url.searchParams.set('session_id', sessionId);
        console.log('🎯 UNIFIED AVATAR: Passing session_id to agent:', sessionId);
      } else {
        console.warn('⚠️ UNIFIED AVATAR: No session_id found in cookies');
      }
      
      const response = await fetch(url.toString());
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
    if (isExpanded && !connectionDetails) {
      refreshConnectionDetails();
    }
  }, [isExpanded, connectionDetails]);

  // Handle room events and data messages
  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      setIsConnecting(false);
      refreshConnectionDetails();
    };
    
    const onDataReceived = async (payload: Uint8Array) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        console.log('🎯 AVATAR: Received data message:', message);
        
        if (message.type === 'checkout_trigger') {
          console.log('🔥 AVATAR: Checkout trigger received, redirecting to Stripe...');
          
          // Call the existing checkout API endpoint
          const res = await fetch('/api/stripe/checkout', { method: 'POST' });
          const data = await res.json();
          
          if (data.url) {
            console.log('🔥 AVATAR: Redirecting to checkout:', data.url);
            window.location.href = data.url;
          } else {
            console.error('🔥 AVATAR: Checkout failed:', data.error);
          }
        }
      } catch (error) {
        console.error('Error handling data message:', error);
      }
    };
    
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.DataReceived, onDataReceived);
    
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.DataReceived, onDataReceived);
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
    setSessionStarted(false);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg flex items-center justify-center"
          size="lg"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gradient-to-br from-teal-500/90 to-blue-600/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/coach-avatar.png" />
              <AvatarFallback className="bg-white/20 text-white text-xs">HC</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-semibold text-sm">Your Personal Hydration Coach</h3>
              <p className="text-white/70 text-xs">I'm here to help with science-backed advice and custom combos.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content - Use LiveKit Components when connected */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {sessionStarted ? (
            <UnifiedChatAvatarContent room={room} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Ready to optimize your hydration?</h3>
              <p className="text-white/80 text-sm mb-6">I'll calculate your exact fluid needs and recommend the perfect products for your goals.</p>
              <Button 
                onClick={startSession} 
                disabled={isConnecting || !connectionDetails}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Talk to Coach'}
              </Button>
            </div>
          )}
        </div>
      </RoomContext.Provider>
    </div>
  )
}
