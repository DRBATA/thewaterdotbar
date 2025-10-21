"use client"

import { Apple } from 'lucide-react'

export default function ProteinPage() {
  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Protein & Water Retention</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          How protein helps your body hold onto the water it needs
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-12 text-center">
        <Apple className="h-16 w-16 mx-auto mb-4 text-purple-600" />
        <h2 className="text-2xl font-bold mb-4">Content Coming Soon</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Learn about the role of protein in maintaining fluid balance and cellular hydration.
        </p>
      </div>
    </div>
  )
}
