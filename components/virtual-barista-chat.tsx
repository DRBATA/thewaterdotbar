"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { logEvent } from "@/lib/analytics"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizonal, MessageSquare, X } from "lucide-react"

export function VirtualBaristaChat() {
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    onFinish: () => {
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
      <div className="fixed bottom-6 right-4 z-50">
        <Button
          onClick={toggleChat}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0 text-white shadow-lg transition-transform hover:scale-110 active:scale-100"
        >
          <MessageSquare className="h-8 w-8" />
        </Button>
      </div>
    )
  }

  // Expanded chat view
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end space-y-2">
      <div className="relative flex h-[70vh] w-full max-w-md flex-col rounded-2xl bg-white/80 shadow-2xl backdrop-blur-lg">
        {/* Chat header with close button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Avatar className="mr-3">
              <AvatarImage src="/friendly-barista-icon.png" alt="Virtual Barista" />
              <AvatarFallback>VB</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-lg text-slate-800">Virtual Barista</div>
              <p className="text-sm text-stone-500">Here to help with your Morning Party experience!</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleChat} className="rounded-full">
            <X className="h-5 w-5" />
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
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </ScrollArea>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about the Morning Party or our premium experiences..."
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
