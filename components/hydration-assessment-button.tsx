"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Droplets } from "lucide-react"
import { HydrationAssessmentModal } from "./hydration/HydrationAssessmentNew"

export function HydrationAssessmentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    // Get session ID from cookie (same as main cart)
    // We'll pass empty string and let the API handle session creation
    setSessionId("")

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
    />
  )
}
