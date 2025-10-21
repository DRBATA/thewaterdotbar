"use client"

import { Heart } from 'lucide-react'

export default function MicrobiomePage() {
  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Gut-Brain Connection</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Fiber, neuropeptides, and the vagus nerve's role in wellness
        </p>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-12 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4 text-red-600" />
        <h2 className="text-2xl font-bold mb-4">Content Coming Soon</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Explore how your microbiome feeds on fiber to produce neuropeptides that 
          signal your brain through the vagus nerve.
        </p>
      </div>
    </div>
  )
}
