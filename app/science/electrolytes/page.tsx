"use client"

import { Zap } from 'lucide-react'

export default function ElectrolytesPage() {
  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Electrolyte Balance</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Understanding sodium, potassium, magnesium, and why they matter more than you think
        </p>
      </div>

      {/* Content placeholder */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-12 text-center">
        <Zap className="h-16 w-16 mx-auto mb-4 text-orange-600" />
        <h2 className="text-2xl font-bold mb-4">Content Coming Soon</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          We're preparing detailed scientific content about electrolyte balance, 
          sweat loss rates, and how to optimize your mineral intake.
        </p>
      </div>
    </div>
  )
}
