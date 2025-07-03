"use client"

import { useFilters } from "@/context/filter-context"
import { Button } from "@/components/ui/button"

import { useState } from "react"

export default function FilterBar() {
  const {
    activeTags,
    suggestedTags,
    toggleTag,
  } = useFilters()
  const [showFilters, setShowFilters] = useState(false)

  if (suggestedTags.length === 0) return null

  if (!showFilters) {
    return (
      <div className="sticky top-20 z-30 flex justify-center px-4 py-2">
        <button
          className="bg-white/20 backdrop-blur-lg border border-white/30 text-teal-600 hover:bg-white/30 rounded-lg px-4 py-2 font-semibold transition-all shadow-lg"
          onClick={() => setShowFilters(true)}
        >
          filter by experiences & drinks
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-20 z-30 flex flex-wrap gap-3 justify-center px-4 py-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl mx-auto max-w-3xl shadow-lg">
      {suggestedTags.map((tag) => (
        <Button
          key={tag}
          size="sm"
          variant={activeTags.includes(tag) ? "default" : "outline"}
          className={
            activeTags.includes(tag)
              ? "bg-teal-400/90 hover:bg-teal-500 border-teal-500 text-white"
              : "border-teal-400 text-teal-600 hover:bg-teal-50"
          }
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Button>
      ))}
      <button
        className="ml-2 bg-white/20 backdrop-blur-lg border border-white/30 text-teal-600 hover:bg-white/30 rounded-lg px-3 py-1 font-semibold transition-all shadow-lg"
        onClick={() => setShowFilters(false)}
        aria-label="Hide filters"
      >
        ×
      </button>
    </div>
  )
}

