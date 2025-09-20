'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useHydration } from '@/hooks/useHydration'

// Create the context type from the hook
type HydrationContextType = ReturnType<typeof useHydration>

// Create context
const HydrationContext = createContext<HydrationContextType | null>(null)

// Provider component
export function HydrationProvider({ children }: { children: ReactNode }) {
  const hydrationData = useHydration()
  
  return (
    <HydrationContext.Provider value={hydrationData}>
      {children}
    </HydrationContext.Provider>
  )
}

// Custom hook to use the context
export function useHydrationContext() {
  const context = useContext(HydrationContext)
  if (!context) {
    throw new Error('useHydrationContext must be used within HydrationProvider')
  }
  return context
}