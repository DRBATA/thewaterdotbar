"use client"

import { useState } from 'react'
import { QrCode, Printer, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PromotionalMaterialsPage() {
  const [venueName, setVenueName] = useState('')
  const [venueUrl, setVenueUrl] = useState('')

  const generateQR = () => {
    // TODO: Implement QR code generation
    alert('QR code generation will be implemented here')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promotional Materials</h1>
        <p className="text-gray-600 mt-2">Generate QR codes and printable materials for your venue</p>
      </div>

      {/* QR Code Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <QrCode className="h-5 w-5 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Generate Venue QR Code</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g., F45 Training - Dubai DIFC"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="venueUrl">Custom URL (optional)</Label>
              <Input
                id="venueUrl"
                value={venueUrl}
                onChange={(e) => setVenueUrl(e.target.value)}
                placeholder="e.g., /menu?venue=f45-difc"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use default menu page
              </p>
            </div>

            <Button 
              onClick={generateQR}
              className="w-full"
              disabled={!venueName}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </div>

          {/* Preview Area */}
          <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <QrCode className="h-24 w-24 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm text-center">
              QR code preview will appear here
            </p>
            {venueName && (
              <p className="text-xs text-gray-400 mt-2">
                For: {venueName}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Once generated, you can:</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>

      {/* Marketing Materials */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketing Materials</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors cursor-pointer">
            <div className="bg-teal-50 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="font-semibold mb-2">Table Tent</h3>
            <p className="text-sm text-gray-600">Printable folding card</p>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors cursor-pointer">
            <div className="bg-blue-50 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-4xl">🏷️</span>
            </div>
            <h3 className="font-semibold mb-2">Sticker Sheet</h3>
            <p className="text-sm text-gray-600">QR code stickers</p>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors cursor-pointer">
            <div className="bg-purple-50 rounded-lg h-32 mb-4 flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-semibold mb-2">Poster</h3>
            <p className="text-sm text-gray-600">A4/Letter size</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Templates coming soon – download branded materials for your venue
        </p>
      </div>

      {/* Onboarding Guide */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Onboarding Guide</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="font-bold mr-3">1.</span>
            <span>Generate your venue QR code using the form above</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">2.</span>
            <span>Print QR codes on table tents, stickers, or posters</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">3.</span>
            <span>Place materials in visible locations (counter, tables, entrance)</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">4.</span>
            <span>Train staff on the hydration assessment and recommendation system</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">5.</span>
            <span>Monitor stock levels and reorder as needed</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
