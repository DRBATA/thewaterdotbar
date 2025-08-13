"use client"

import { useState, useEffect, useMemo } from "react";
import useConnectionDetails from '@/hooks/useConnectionDetails';
import { Room, RoomEvent, Track, RemoteParticipant } from 'livekit-client';
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
import { MessageSquare, X, Phone, PhoneOff, Mic, MicOff, Sparkles, Wand2, UserCircle, Crosshair } from "lucide-react"
import useChatAndTranscription from "@/hooks/useChatAndTranscription"
import { cn } from "@/lib/utils"
import { AvatarTile } from '@/components/livekit/avatar-tile';
import { AgentTile } from '@/components/livekit/agent-tile';
import { useAgentControlBar } from '@/components/livekit/agent-control-bar/hooks/use-agent-control-bar';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

function UnifiedChatAvatarContent({ room, setIsExpanded }: { room: Room; setIsExpanded: (value: boolean) => void }) {
  const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(true); // Always show chat in our unified view
  const { messages, send } = useChatAndTranscription();
  
  // Use the AgentControlBar hook for reliable mute/disconnect functionality
  const {
    microphoneToggle,
    handleDisconnect,
  } = useAgentControlBar({
    controls: {
      microphone: true,
      leave: true,
    },
    saveUserChoices: true,
  });
  
  // Use education frontend's track management instead of manual participant finding
  const videoTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const agentVideoTrack = videoTracks.find(track => !track.participant.isLocal);

  async function handleSendMessage(message: string) {
    await send(message);
  }

  // Debug: Log agent state to understand why buttons are disabled
  console.log('🔍 Agent State Debug:', {
    agentState,
    isAgentAvailable: isAgentAvailable(agentState),
    hasVideoTrack: !!agentVideoTrack,
    microphoneEnabled: microphoneToggle.enabled,
    microphonePending: microphoneToggle.pending,
    roomState: room?.state
  });

  // Debug: Log messages to see if they're being received
  console.log('💬 Messages Debug:', {
    messagesCount: messages.length,
    messages: messages,
    sendFunction: typeof send
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/coach-avatar.png" />
            <AvatarFallback className="bg-white/20 text-white text-xs"></AvatarFallback>
          </Avatar>
          
          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Profile/Quiz Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-white/20 text-white"
              onClick={() => {
                console.log('👤 Profile/Quiz clicked');
                // TODO: Open profile/quiz popup
              }}
            >
              <UserCircle className="w-4 h-4" />
            </Button>
            
            {/* Flash Cards/Targets Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-white/20 text-white"
              onClick={() => {
                console.log('🎯 Flash Cards/Targets clicked');
                // TODO: Open flash cards popup
              }}
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center space-x-2">
          {/* Microphone Mute Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('🎤 HEADER MUTE CLICKED!', { 
                microphoneEnabled: microphoneToggle.enabled,
                pending: microphoneToggle.pending
              });
              microphoneToggle.toggle();
            }}
            disabled={microphoneToggle.pending}
            className={`text-white/70 hover:text-white hover:bg-white/10 ${
              !microphoneToggle.enabled ? 'bg-red-500/20 text-red-300' : ''
            }`}
            title={microphoneToggle.enabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {microphoneToggle.enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          
          {/* Disconnect Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('🔴 HEADER DISCONNECT CLICKED!', { 
                roomState: room?.state,
                agentState 
              });
              handleDisconnect();
            }}
            disabled={agentState === 'disconnected'}
            className="text-white/70 hover:text-white hover:bg-red-500/20 hover:text-red-300"
            title="Disconnect from coach"
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white/70 hover:text-white hover:bg-white/10"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Flex container for messages and input */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Video Background - Full visibility */}
        <div className="absolute inset-0 z-0">
          {agentVideoTrack ? (
            <AvatarTile 
              videoTrack={agentVideoTrack}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
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
            </div>
          )}
        </div>

        {/* Chat Messages - Cinematic bottom overlay - more compact */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden z-10">
          {/* Gradient overlay for cinematic fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div 
          className="absolute bottom-0 left-0 right-0 max-h-[50%] overflow-y-auto overscroll-contain p-4 pb-16 space-y-2 select-text scroll-smooth"
          onWheel={(e) => e.stopPropagation()} // Prevent background scrolling
        >
          {/* Debug: Show message count */}
          {messages.length === 0 && (
            <div className="text-center text-white/70 text-xs p-3 backdrop-blur-sm rounded-lg">
              💬 Start chatting...
            </div>
          )}
          
          {messages.map((message, index) => {
            console.log('🎨 Rendering message:', message);
            const isLatest = index === messages.length - 1;
            return (
              <div key={`${message.id || 'msg'}-${index}-${message.timestamp || Date.now()}`} className={`flex ${message.from?.isLocal ? 'justify-end' : 'justify-start'} transition-all duration-500 ${isLatest ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}`}>
                <div className={`max-w-[55%] p-2 rounded-xl shadow-2xl backdrop-blur-md ${
                  message.from?.isLocal 
                    ? 'bg-teal-500/70 text-white rounded-br-lg border border-teal-300/30'
                    : 'bg-white/70 text-gray-900 rounded-bl-lg border border-white/30'
                } ${isLatest ? 'ring-1 ring-white/30' : ''}`}>
                  <p className="text-xs whitespace-pre-wrap font-medium">{message.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Chat Input - Floating at bottom with cinematic blur - more compact */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-md z-20">
        <div className="flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-black/40 backdrop-blur-lg text-white placeholder-white/60 rounded-full border border-white/20 focus:outline-none focus:border-teal-400 focus:bg-black/50 transition-all duration-300 shadow-lg text-sm"
            onKeyPress={(e) => {
              console.log('⌨️ CHAT INPUT KEY PRESSED:', e.key);
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                console.log('💬 SENDING MESSAGE:', input.value);
                if (input.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              console.log('📤 SEND BUTTON CLICKED!');
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
              if (input.value.trim()) {
                console.log('💬 SENDING MESSAGE via button:', input.value);
                handleSendMessage(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
      </div> {/* Close main content area */}
    </div>
  );
}

// Define the interface for cart action RPC payloads
interface CartActionPayload {
  action: 'add' | 'remove' | 'checkout' | 'apply_discount' | 'view_cart' | 'close_cart' | 'clear_cart' | 'copy_discount';
  product_id?: string;
  product_name?: string;
  quantity?: number;
  discount_code?: string;
  scroll_to_item?: boolean;
}

export function UnifiedChatAvatar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const room = useMemo(() => new Room(), []);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();

  // Handle room events and connection lifecycle
  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      setConnectionError(true);
      refreshConnectionDetails();
    };

    const onConnected = () => {
      setConnectionError(false);
    };

    const onConnectionFailed = () => {
      setConnectionError(true);
      setSessionStarted(false);
    };

    // Handle RPC calls from the agent for cart actions
    const handleCartAction = async (data: any): Promise<string> => {
      console.log('Received cart action RPC from agent:', data);
      
      try {
        // Parse the payload string into a JSON object (following education demo pattern)
        const payload: CartActionPayload = typeof data.payload === 'string' 
          ? JSON.parse(data.payload) 
          : data.payload;
        
        console.log('Parsed cart action payload:', payload);
        
        switch (payload.action) {
          case 'add':
            if (payload.product_id && payload.quantity) {
              console.log(`Agent wants to add ${payload.quantity} of product ${payload.product_id}`);
              // Dispatch custom event to trigger add to cart
              window.dispatchEvent(new CustomEvent('agent-add-to-cart', {
                detail: {
                  product_id: payload.product_id,
                  product_name: payload.product_name,
                  quantity: payload.quantity,
                  scrollToItem: payload.scroll_to_item
                }
              }));
            }
            break;
            
          case 'remove':
            if (payload.product_id && payload.quantity) {
              console.log(`Agent wants to remove ${payload.quantity} of product ${payload.product_id}`);
              // Dispatch custom event to trigger remove from cart
              window.dispatchEvent(new CustomEvent('agent-remove-from-cart', {
                detail: {
                  product_id: payload.product_id,
                  product_name: payload.product_name,
                  quantity: payload.quantity
                }
              }));
            }
            break;
            
          case 'view_cart':
            console.log('Agent wants to open cart modal');
            // Dispatch custom event to open cart modal (like clicking VIEW CART button)
            window.dispatchEvent(new CustomEvent('agent-view-cart', {
              detail: {}
            }));
            break;
            
          case 'close_cart':
            console.log('Agent wants to close cart modal');
            // Dispatch custom event to close cart modal
            window.dispatchEvent(new CustomEvent('agent-close-cart', {
              detail: {}
            }));
            break;
            
          case 'clear_cart':
            console.log('Agent wants to clear cart');
            // Dispatch custom event to clear cart
            window.dispatchEvent(new CustomEvent('agent-clear-cart', {
              detail: {}
            }));
            break;
            
          case 'checkout':
            console.log('Agent wants to proceed to checkout');
            // Dispatch custom event to trigger checkout
            window.dispatchEvent(new CustomEvent('agent-checkout', {
              detail: {}
            }));
            break;
            
          case 'copy_discount':
            console.log('Agent wants to copy discount code');
            // Dispatch custom event to copy discount code to clipboard
            window.dispatchEvent(new CustomEvent('agent-copy-discount', {
              detail: {}
            }));
            break;
        }
        return "Success"; // Return success message to agent
      } catch (error) {
        console.error('Error parsing RPC payload:', error);
        return "Error: " + (error instanceof Error ? error.message : String(error));
      }
    };

    room.on(RoomEvent.Disconnected, onDisconnected);
    
    // Register RPC method to receive cart actions (following education demo pattern)
    console.log('🔧 Registering RPC method client.cart_action');
    room.localParticipant.registerRpcMethod(
      "client.cart_action",
      handleCartAction
    );
    console.log('✅ RPC method client.cart_action registered successfully');

    if (sessionStarted && room.state === 'disconnected' && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: true,
        }),
        room.connect(process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).catch((error) => {
        console.error('Error connecting to the agent', error);
      });
    }

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Connected, onConnected);
      // Unregister RPC method when component unmounts
      room.localParticipant.unregisterRpcMethod("client.cart_action");
      room.disconnect();
    };
  }, [room, sessionStarted, connectionDetails, refreshConnectionDetails]);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:left-6 md:transform-none z-50">
        {/* Magical sparkle cloud background */}
        <div className="absolute inset-0 -m-8 pointer-events-none">
          {/* Animated sparkles */}
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{top: '10%', left: '15%', animationDelay: '0s'}} />
          <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{top: '25%', right: '20%', animationDelay: '0.5s'}} />
          <div className="absolute w-3 h-3 bg-teal-300 rounded-full animate-pulse" style={{bottom: '30%', left: '10%', animationDelay: '1s'}} />
          <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{top: '60%', right: '15%', animationDelay: '1.5s'}} />
          <div className="absolute w-2 h-2 bg-purple-300 rounded-full animate-pulse" style={{bottom: '15%', right: '25%', animationDelay: '2s'}} />
          <div className="absolute w-1 h-1 bg-teal-400 rounded-full animate-ping" style={{top: '40%', left: '5%', animationDelay: '2.5s'}} />
          
          {/* Glowing aura */}
          <div className="absolute inset-0 bg-gradient-radial from-teal-400/20 via-purple-400/10 to-transparent blur-xl animate-pulse" />
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/15 via-teal-400/10 to-transparent blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        
        {/* Main button with gradient animation */}
        <Button
          onClick={() => setIsExpanded(true)}
          className="relative px-6 py-4 rounded-full shadow-2xl flex items-center justify-center gap-3 whitespace-nowrap overflow-hidden group
                     bg-gradient-to-r from-teal-500 via-purple-500 to-yellow-500 
                     hover:from-yellow-500 hover:via-teal-500 hover:to-purple-500
                     transition-all duration-1000 ease-in-out
                     animate-gradient-x bg-[length:200%_200%]
                     border-2 border-white/30 backdrop-blur-sm"
          size="lg"
          style={{
            background: 'linear-gradient(-45deg, #14b8a6, #a855f7, #eab308, #06b6d4)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 3s ease infinite'
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Sparkles className="w-5 h-5 text-white flex-shrink-0 animate-pulse" />
          <span className="text-white font-semibold text-sm uppercase tracking-wide drop-shadow-lg">
            TAP FOR PERSONALISED HYDRATION PLAN
          </span>
        </Button>
        
        {/* CSS animations */}
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:left-4 md:transform-none w-80 h-[420px] bg-gradient-to-br from-teal-500/90 to-blue-600/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 flex flex-col">
      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Enable audio" />
        
        {/* Main Content - Use LiveKit Components when connected */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {connectionError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <PhoneOff className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-white font-semibold mb-2">Session Ended</h3>
              <p className="text-white/80 text-sm mb-4">Your coaching session has been disconnected.</p>
              <p className="text-white/60 text-xs mb-6">Refresh to start a new session with your hydration coach.</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Phone className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          ) : sessionStarted ? (
            <UnifiedChatAvatarContent room={room} setIsExpanded={setIsExpanded} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Build your perfect hydration plan!</h3>
              <p className="text-white/80 text-sm mb-4">Get a personalized plan with the right amounts of everything to keep you optimally hydrated throughout your day.</p>
              <Button 
                onClick={() => setSessionStarted(true)} 
                disabled={sessionStarted || !connectionDetails}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 mt-2"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {room.state === 'connecting' ? 'Connecting...' : 'Chat to Free AI Coach'}
              </Button>
            </div>
          )}
        </div>
      </RoomContext.Provider>
    </div>
  )
}
