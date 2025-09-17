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
  }, [])

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 z-50 rounded-full h-14 w-14 p-0 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
        title="AI Hydration Assessment"
      >
        <Droplets className="h-6 w-6 text-white" />
      </Button>

      <HydrationAssessmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={sessionId}
      />
    </>
  )
}
