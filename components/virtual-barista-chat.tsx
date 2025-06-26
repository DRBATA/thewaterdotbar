"use client"

import { useState, useEffect } from "react"
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
  
  const { setActiveTags, setSuggestedTags } = useFilters()

  // On first render, populate pill bar with a comprehensive starter set
  useEffect(() => {
    const initial = [
      "aoi",
      "morning",
      "sparkling",
      "aura",
      "coffee",
      "ginger",
      "copper",
      "perrier",
      "water",
      "chaga",
    ] as string[]
    setSuggestedTags(initial)
  }, [])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    onFinish: (aiMessage) => {
        // Simple heuristic: if AI wants to suggest tags, it can include a pattern [[tags:tag1,tag2]]
        const tagPattern = /\[\[tags:([\w, ]+)]]/i
        const match = aiMessage.content.match(tagPattern)
        if (match) {
          const tags = match[1].split(/[, ]+/).filter(Boolean)
          setSuggestedTags(tags)
          setActiveTags(tags)
          // remove directive from displayed message
          const cleaned = aiMessage.content.replace(tagPattern, '').trim()
          setMessages(prev => prev.map(m => m.id === aiMessage.id ? { ...m, content: cleaned } : m))
        }

      if (!hasSentFirstMessage) {
        logEvent({ event_name: "chat_started", step_name: "barista_chat" })
        setHasSentFirstMessage(true)
      }
    },
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content: "👋 Here for the Morning Party rave? It's FREE! Just add the ticket to cart—no credit card needed to claim your spot!"
      }
    ]
  })

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
            className="rounded-full px-6 py-3 bg-pink-400/90 hover:bg-pink-500 text-white shadow-lg flex items-center gap-2 font-bold text-base"
          >
            <MessageSquare className="size-5" />
            Click to chat for discounts and more
          </Button>
        </div>
      </>
    )
  }

  // Expanded chat view
  return (
    <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] z-30 bg-white border-t border-stone-200 shadow-lg">
      <div className="container mx-auto max-w-3xl p-4">
        {/* Chat header with close button */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
          <div className="flex items-center">
            <Avatar className="mr-3">
              <AvatarImage src="/friendly-barista-icon.png" alt="Virtual Barista" />
              <AvatarFallback>VB</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">Chat for Combo tips and discounts </h3>
              <p className="text-sm text-stone-500">Tap + on item card to add to Cart • Cart top-right • Filter with tags</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleChat} className="text-stone-500 hover:text-stone-700">
            <X className="size-5" />
          </Button>
        </div>
        
        {/* Chat messages */}
        <ScrollArea id="chat-messages" className="h-64 w-full pr-4 mb-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex mb-3 ${m.role === "user" ? "justify-end" : ""}`}>
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  m.role === "user" ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="flex mb-3">
              <div className="max-w-[70%] p-3 rounded-lg bg-stone-100 text-stone-800">
                <p className="text-sm">Mixing...</p>
              </div>
            </div>
          )}
        </ScrollArea>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="What's on your mind?"
            className="flex-grow focus-visible:ring-amber-500"
          />
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            <SendHorizonal className="size-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
