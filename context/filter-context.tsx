"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface FilterContextValue {
  activeTags: string[]
  suggestedTags: string[]
  setActiveTags: (tags: string[]) => void
  setSuggestedTags: (tags: string[]) => void
  toggleTag: (tag: string) => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <FilterContext.Provider
      value={{ activeTags, suggestedTags, setActiveTags, setSuggestedTags, toggleTag }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return ctx
}
