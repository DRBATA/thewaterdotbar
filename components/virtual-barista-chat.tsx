"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { logEvent } from "@/lib/analytics"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizonal } from "lucide-react"

export function VirtualBaristaChat() {
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat", // We'll create this API route next
    onFinish: () => {
      if (!hasSentFirstMessage) {
        logEvent({ event_name: "chat_started", step_name: "barista_chat" })
        setHasSentFirstMessage(true)
      }
    },
  })

  return (
    <div className="max-w-2xl mx-auto my-8 p-4 sm:p-6 border border-stone-200 rounded-xl shadow-lg bg-white">
      <div className="flex items-center mb-4">
        <Avatar className="mr-3">
          <AvatarImage src="/friendly-barista-icon.png" alt="Virtual Barista" />
          <AvatarFallback>VB</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold text-amber-800">Virtual Barista</h3>
          <p className="text-sm text-stone-500">How can I help you find the perfect refreshment or experience?</p>
        </div>
      </div>
      <ScrollArea className="h-72 w-full pr-4 mb-4 border-t border-b border-stone-200 py-4">
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
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Tell me about your day or what you're craving..."
          className="flex-grow focus-visible:ring-amber-500"
        />
        <Button type="submit" disabled={isLoading} className="bg-amber-700 hover:bg-amber-800 text-white">
          <SendHorizonal className="size-5" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}
