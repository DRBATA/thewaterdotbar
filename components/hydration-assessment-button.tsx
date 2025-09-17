"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Droplets } from "lucide-react"
import { HydrationAssessmentModal } from "./hydration-assessment-modal"

export function HydrationAssessmentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    // Get or create session ID from localStorage
    let sid = localStorage.getItem("sessionId")
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("sessionId", sid)
    }
    setSessionId(sid)

    // Listen for custom event from UnifiedChatAvatar
    const handleOpenModal = () => setIsModalOpen(true)
    window.addEventListener('openHydrationAssessment', handleOpenModal)
    
    return () => {
      window.removeEventListener('openHydrationAssessment', handleOpenModal)
    }
  }, [])

  return (
    <HydrationAssessmentModal 
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      sessionId={sessionId}
    />
  )
}
