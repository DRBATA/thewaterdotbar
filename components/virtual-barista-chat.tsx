"use client"

import { useState, useEffect } from "react"
import { db, type UserProfile } from "@/lib/client-db"
import { useChat } from "ai/react"
import { logEvent } from "@/lib/analytics"
import { useFilters } from "@/context/filter-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizonal, MessageSquare, X } from "lucide-react"

export function VirtualBaristaChat() {
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  const { setActiveTags, setSuggestedTags } = useFilters()

  // On first render, populate pill bar with a comprehensive starter set
  useEffect(() => {
    const initial = [
      "morning",
      "sparkling",
      "aura",
      "coffee",
      "ginger",
      "copper",
      "perrier",
      "water",
      "chaga",
      "electrolytes",
      "energy",
      "focus",
      "rest"
    ] as string[]
    setSuggestedTags(initial)

    // On first render, also load the user's profile from the local DB
    const loadProfile = async () => {
      const profile = await db.getProfile()
      if (profile) {
        setUserProfile(profile)
      }
    }
    loadProfile()
  }, [])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    body: {
      userProfile,
    },
    api: "/api/chat",
    onFinish: async (aiMessage) => {
      let messageContent = aiMessage.content;
      let wasModified = false;

      // Handle Tag Suggestions: [[tags:tag1,tag2]]
      const tagPattern = /\[\[tags:([\w, ]+)]]/i;
      const tagMatch = messageContent.match(tagPattern);
      if (tagMatch && tagMatch[1]) {
        const tags = tagMatch[1].split(/[, ]+/).filter(Boolean);
        setSuggestedTags(tags);
        setActiveTags(tags);
        messageContent = messageContent.replace(tagPattern, '').trim();
        wasModified = true;
      }

      // New, robust directive handler for saving profile data
      const profilePattern = /\[\[save-full-profile:(.*?)]]/i;
      const profileMatch = messageContent.match(profilePattern);

      if (profileMatch && profileMatch[1]) {
        const dataPairs = profileMatch[1].split(',');
        const newProfileData: Partial<UserProfile> = {};

        const keyMapping: { [key: string]: keyof UserProfile } = {
          weight: 'weightKg',
          sex: 'sex',
          activity_level: 'activityLevel',
          bfp: 'estimatedBodyFatPercentage',
          lbm: 'leanBodyMassKg',
          water_target_ml: 'dailyWaterTargetMl',
          potassium_target_mg: 'dailyPotassiumTargetMg',
          sodium_target_mg: 'dailySodiumTargetMg',
          protein_target_g: 'dailyProteinTargetG',
        };

        dataPairs.forEach((pair: string) => {
          const [key, value] = pair.split('=');
          const mappedKey = keyMapping[key.trim()];
          if (mappedKey && value) {
            const trimmedValue = value.trim();
            // Check if the property should be a number
            if (['weightKg', 'estimatedBodyFatPercentage', 'leanBodyMassKg', 'dailyWaterTargetMl', 'dailySodiumTargetMg', 'dailyPotassiumTargetMg', 'dailyProteinTargetG'].includes(mappedKey)) {
              (newProfileData as any)[mappedKey] = parseFloat(trimmedValue);
            } else {
              (newProfileData as any)[mappedKey] = trimmedValue;
            }
          }
        });

        if (Object.keys(newProfileData).length > 0) {
          console.log('Full profile directive found, saving data:', newProfileData);
          await db.saveProfile(newProfileData);
          const updatedProfile = await db.getProfile();
          setUserProfile(updatedProfile || null);
          messageContent = messageContent.replace(profilePattern, '').trim();
          wasModified = true;
        }
      }

      // If any directives were processed, update the message list with the cleaned content
      if (wasModified) {
        setMessages(prev => prev.map(m => m.id === aiMessage.id ? { ...m, content: messageContent } : m));
      }

      // Log the initial chat event
      if (!hasSentFirstMessage) {
        logEvent({ event_name: "chat_started", step_name: "barista_chat" });
        setHasSentFirstMessage(true);
      }
    },
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content: "Hello! I'm your personal hydration coach. I can calculate your exact fluid needs based on your lifestyle and goals. Tell me about your activity level and what you're looking to achieve today!"
      }
    ]
  });

  // Use effect to scroll to bottom when messages change or expanded state changes
  useEffect(() => {
    if (isExpanded) {
      const scrollArea = document.getElementById("chat-messages");
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isExpanded]);

  const toggleChat = () => {
    setIsExpanded(!isExpanded)
    logEvent({
      event_name: isExpanded ? "chat_collapsed" : "chat_expanded",
      step_name: "barista_chat"
    })
  }

  // Collapsed chat bubble view
  if (!isExpanded) {
    return (
      <>
        {/* Large barista visual positioned behind the call-to-action */}
        <img
          src="/barista.png"
          alt="Virtual Barista"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-48 md:w-64 z-40 pointer-events-none select-none"
        />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={toggleChat}
            aria-label="Open chat"
            className="rounded-full px-6 py-3 bg-teal-400/90 hover:bg-teal-500 text-white shadow-lg flex items-center gap-2 font-bold text-base"
          >
            <MessageSquare className="size-5" />
            Perfect your functional hydration
          </Button>
        </div>
      </>
    )
  }

  // Expanded chat view
  return (
    <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] z-30 border-t border-white/20 bg-cyan-950/50 shadow-lg backdrop-blur-xl">
      <div className="container mx-auto max-w-3xl p-4">
        {/* Chat header with close button */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
          <div className="flex items-center">
            <Avatar className="mr-3">
              <AvatarImage src="/friendly-barista-icon.png" alt="Virtual Barista" />
              <AvatarFallback>VB</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-white/90">Your Personal Hydration Coach</h3>
              <p className="text-sm text-white/70">I'm here to help with science-backed advice and custom combos.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleChat} className="text-white/70 hover:text-white">
            <X className="size-5" />
          </Button>
        </div>
        
        {/* Chat messages */}
        <ScrollArea id="chat-messages" className="h-64 w-full pr-4 mb-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex mb-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                  m.role === "user"
                    ? "bg-teal-500/80 text-white rounded-br-lg"
                    : "bg-white/10 text-white/90 rounded-bl-lg"
                }`}
              >
                {m.id === 'welcome-message' ? (
                  <div className="text-sm prose prose-sm prose-p:m-0" dangerouslySetInnerHTML={{ __html: m.content }} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[75%] p-3 rounded-2xl shadow-sm bg-stone-100 text-stone-800 rounded-bl-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="clarity, calm, energy, or gut-reset?"
            className="flex-grow bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-teal-400"
          />
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <SendHorizonal className="size-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
