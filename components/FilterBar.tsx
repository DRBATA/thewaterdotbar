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
          className="bg-water/15 backdrop-blur-lg border border-water/30 text-teal-600 hover:bg-water/25 rounded-lg px-4 py-2 font-semibold transition-all shadow-lg"
          onClick={() => setShowFilters(true)}
        >
          filter by experiences & drinks
        </button>
      </div>
    )
  }

  return (
    <div className="sticky top-20 z-30 flex flex-wrap gap-3 justify-center px-4 py-2 bg-water/15 backdrop-blur-lg border border-water/30 rounded-xl mx-auto max-w-3xl shadow-lg">
      {suggestedTags.map((tag) => (
        <Button
          key={tag}
          size="sm"
          variant={activeTags.includes(tag) ? "default" : "outline"}
          className={
            activeTags.includes(tag)
              ? "bg-water-400/90 hover:bg-water-400 border-water-400 text-white"
              : "border-water-300 text-water-600 hover:bg-water/5"
          }
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Button>
      ))}
      <button
        className="ml-2 bg-water/15 backdrop-blur-lg border border-water/30 text-teal-600 hover:bg-water/25 rounded-lg px-3 py-1 font-semibold transition-all shadow-lg"
        onClick={() => setShowFilters(false)}
        aria-label="Hide filters"
      >
        ×
      </button>
    </div>
  )
}

