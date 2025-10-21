"use client"

import { Activity } from 'lucide-react'

export default function EnergyPage() {
  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Energy Production</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The Krebs cycle and micronutrients needed for efficient energy use
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-12 text-center">
        <Activity className="h-16 w-16 mx-auto mb-4 text-teal-600" />
        <h2 className="text-2xl font-bold mb-4">Content Coming Soon</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Learn about the Krebs cycle and how B-vitamins, magnesium, and other micronutrients 
          enable efficient cellular energy production.
        </p>
      </div>
    </div>
  )
}
