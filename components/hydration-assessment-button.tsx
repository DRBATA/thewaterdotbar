"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Droplets } from "lucide-react"
import { HydrationAssessmentModal } from "./hydration/HydrationAssessmentNew"
import { HydrationProvider } from "@/contexts/HydrationContext"
import { useSearchParams } from "next/navigation"

export function HydrationAssessmentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get session ID from cookie (same as main cart)
    // We'll pass empty string and let the API handle session creation
    setSessionId("")

    // Check for tracking order from email link
    const orderId = searchParams?.get('track_order')
    if (orderId) {
      setTrackingOrderId(orderId)
      setIsModalOpen(true) // Auto-open modal
    }

    // Listen for custom event from UnifiedChatAvatar
    const handleOpenModal = () => setIsModalOpen(true)
    window.addEventListener('openHydrationAssessment', handleOpenModal)
    
    return () => {
      window.removeEventListener('openHydrationAssessment', handleOpenModal)
    }
  }, [searchParams])

  return (
    <HydrationProvider>
      <HydrationAssessmentModal 
        isOpen={isModalOpen}
        onCloseAction={() => {
          setIsModalOpen(false)
          setTrackingOrderId(null) // Clear tracking order on close
        }}
        trackingOrderId={trackingOrderId}
      />
    </HydrationProvider>
  )
}
