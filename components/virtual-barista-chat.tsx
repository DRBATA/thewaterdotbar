"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { logEvent } from "@/lib/analytics"
import { useFilters } from "@/context/filter-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizonal, MessageSquare, X, Clock } from "lucide-react"
import db, { UserProfile, TimelineEvent } from "@/lib/client-db"
import { TimelineModal } from "@/components/ui/timeline-modal"

export function VirtualBaristaChat() {
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false) 
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const { setActiveTags, setSuggestedTags } = useFilters()

  const refreshTimeline = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = await db.getTimelineEvents(today);
    setTimelineEvents(events);
  };

  useEffect(() => {
    async function loadInitialData() {
      const profile = await db.getPrimaryProfile();
      if (profile) {
        setUserProfile(profile);
        if (profile.nickname) {
          setMessages(prev => prev.map(m => 
            m.id === 'welcome-message' 
              ? { ...m, content: `Hey mate—how was the footy yesterday? Bet you're feelin’ a bit thirsty today.` } 
              : m
          ));
        }
      }
      await refreshTimeline();
    }
    loadInitialData();

    const initial = ["aoi", "morning", "sparkling", "aura", "coffee", "ginger", "copper", "perrier", "water", "chaga", "electrolytes"] as string[]
    setSuggestedTags(initial)
  }, [])

  const { messages, input, handleInputChange, isLoading, setMessages, append, setInput } = useChat({
    body: { userProfile, timelineEvents },
    api: "/api/chat",
    onFinish: (aiMessage) => {
      let messageContent = aiMessage.content;
      const directiveRegex = /\[\[(nickname|weight|activityLevel|bodyType|log|tags):(.*?)(\]\])/g;
      const directives = Array.from(messageContent.matchAll(directiveRegex));

      if (directives.length > 0) {
        const profileUpdates: Partial<UserProfile> = {};
        let hasProfileUpdates = false;

        const handleDirective = async () => {
          for (const match of directives) {
            const directive = match[1];
            const value = match[2];
            switch (directive) {
              case 'nickname':
                profileUpdates.nickname = value;
                hasProfileUpdates = true;
                break;
              case 'weight':
                profileUpdates.weight = parseFloat(value.replace(/[^\d.]/g, ''));
                hasProfileUpdates = true;
                break;
              case 'activityLevel':
                profileUpdates.activityLevel = value;
                hasProfileUpdates = true;
                break;
              case 'bodyType':
                profileUpdates.bodyType = value;
                hasProfileUpdates = true;
                break;
              case 'log':
                try {
                  const eventToLog = JSON.parse(value) as TimelineEvent;
                  eventToLog.timestamp = new Date(eventToLog.timestamp);
                  await db.logTimelineEvent(eventToLog);
                  refreshTimeline(); // Refresh after logging
                } catch (e) { console.error("Failed to parse or log event:", e); }
                break;
              case 'tags':
                const tags = value.split(/[, ]+/).filter(Boolean);
                setSuggestedTags(tags);
                setActiveTags(tags);
                break;
            }
          }

          if (hasProfileUpdates) {
            const currentProfile = await db.getPrimaryProfile() || {};
            const newProfile = { ...currentProfile, ...profileUpdates };
            await db.saveProfile(newProfile);
            setUserProfile(newProfile); // This is the critical state update
          }

          const cleanedContent = messageContent.replace(directiveRegex, '').trim();
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) newMessages[newMessages.length - 1].content = cleanedContent;
            return newMessages;
          });
        }

        handleDirective();
      }
      if (!hasSentFirstMessage) {
        logEvent({ event_name: "chat_started", step_name: "barista_chat" });
        setHasSentFirstMessage(true)
      }
    },
    initialMessages: [
      { id: "welcome-message", role: "assistant", content: "G’day mate, welcome to the Water Bar. Tell me how you’re feeling, and I’ll fix you something just right." }
    ]
  })

  useEffect(() => {
    if (isExpanded) {
      const scrollArea = document.getElementById("chat-messages");
      if (scrollArea) {
        setTimeout(() => { scrollArea.scrollTop = scrollArea.scrollHeight; }, 100);
      }
    }
  }, [messages, isExpanded]);

  const toggleChat = () => {
    setIsExpanded(!isExpanded)
    logEvent({ event_name: isExpanded ? "chat_collapsed" : "chat_expanded", step_name: "barista_chat" })
  }

  return (
    <>
      {isTimelineOpen && <TimelineModal events={timelineEvents} onClose={() => setIsTimelineOpen(false)} />}

      {!isExpanded ? (
        <>
          <img
            src="/barista.png"
            alt="I'm your Bar Guy"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-48 md:w-64 z-40 pointer-events-none select-none"
          />
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              onClick={toggleChat}
              aria-label="Open chat"
              className="rounded-full px-6 py-3 bg-teal-400/90 hover:bg-teal-500 text-white shadow-[0_0_20px_rgb(0_255_255_/_0.3)] flex items-center gap-2 font-bold text-base"
            >
              <MessageSquare className="size-5" />
              Talk to your Bar Guy
            </Button>
          </div>
        </>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] z-30 bg-slate-900/80 backdrop-blur-xl border-t-2 border-cyan-300/70 shadow-[0_0_60px_rgb(0_255_255_/_0.3)] text-white">
          <div className="container mx-auto max-w-3xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
              <div className="flex items-center">
                <Avatar className="mr-3">
                  <AvatarImage src="/friendly-barista-icon.png" alt="Bar Guy" />
                  <AvatarFallback>BG</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">💧 Bar Chat</h3>
                  <p className="text-sm text-cyan-200/80">Hydration made fun</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsTimelineOpen(true)} className="text-white/80 hover:text-white" aria-label="Open timeline">
                  <Clock className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleChat} className="text-white/80 hover:text-white" aria-label="Close chat">
                  <X className="size-5" />
                </Button>
              </div>
            </div>
            
            <ScrollArea id="chat-messages" className="h-64 w-full pr-4 mb-4 text-white">
              {messages.map((m) => (
                <div key={m.id} className={`flex mb-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${m.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-700/80 text-white"}`}>
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: m.id === 'welcome-message' ? m.content : '' }} />
                    {m.id !== 'welcome-message' && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                  </div>
                </div>
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <div className="flex mb-3"><div className="max-w-[70%] p-3 rounded-lg bg-slate-700/80 text-white"><p className="text-sm">Mixing...</p></div></div>
              )}
            </ScrollArea>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!input.trim()) return;
              
              // Get timeline events for context
              const history = await db.getAllTimelineEvents();
              setTimelineEvents(history);
              
              // Use the AI SDK's built-in append function to send the message
              // This will handle streaming the response back to the UI
              await append({
                content: input,
                role: 'user'
              });
              setInput('');
            }} className="flex items-center space-x-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Tell me how you're feeling, mate..."
                className="flex-grow bg-slate-800/90 text-white border-cyan-300/30 focus-visible:ring-cyan-400 placeholder:text-slate-400"
              />
              <Button type="submit" disabled={isLoading} className="bg-teal-400/90 hover:bg-teal-500 text-white">
                <SendHorizonal className="size-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}