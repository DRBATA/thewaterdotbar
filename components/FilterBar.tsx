"use client"

import { useFilters } from "@/context/filter-context"
import { Button } from "@/components/ui/button"

export default function FilterBar() {
  const {
    activeTags,
    suggestedTags,
    toggleTag,
  } = useFilters()

  if (suggestedTags.length === 0) return null

  return (
    <div className="sticky top-20 z-30 flex flex-wrap gap-3 justify-center px-4 py-2 backdrop-blur-md bg-white/40 rounded-xl mx-auto max-w-3xl shadow-sm">
      {suggestedTags.map((tag) => (
        <Button
          key={tag}
          size="sm"
          variant={activeTags.includes(tag) ? "default" : "outline"}
          className={
            activeTags.includes(tag)
              ? "bg-pink-400/90 hover:bg-pink-500 border-pink-500 text-white"
              : "border-pink-400 text-pink-600 hover:bg-pink-50"
          }
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Button>
      ))}
    </div>
  )
}
