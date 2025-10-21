"use client"

import { RefreshCw, TrendingDown, Package } from 'lucide-react'

export default function StaffReorderPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reorder Management</h1>
        <p className="text-gray-600 mt-2">Track low stock and initiate reorders</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-teal-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reordering System</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">
          This page will show low-stock items, suggested reorder quantities, and allow 
          you to place orders with distributors directly.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="bg-orange-50 rounded-lg p-4">
            <TrendingDown className="h-6 w-6 text-orange-600 mb-2" />
            <h3 className="font-semibold mb-1">Low Stock Alerts</h3>
            <p className="text-sm text-gray-600">Get notified when products fall below threshold</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <Package className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold mb-1">Smart Suggestions</h3>
            <p className="text-sm text-gray-600">AI-powered reorder quantity recommendations</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <RefreshCw className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-semibold mb-1">Quick Reorder</h3>
            <p className="text-sm text-gray-600">One-click reorder for frequently used items</p>
          </div>
        </div>
      </div>
    </div>
  )
}
