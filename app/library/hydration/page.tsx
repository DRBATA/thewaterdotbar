'use client';

import Link from 'next/link';
import { ArrowLeft, Droplets, Calculator, Thermometer, Activity, ChevronRight } from 'lucide-react';

export default function HydrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/library" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Droplets className="w-10 h-10 text-blue-600" />
            Hydration Science
          </h1>
          <p className="text-xl text-gray-600">
            Precision hydration based on body composition, activity level, and environmental factors
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-6 mb-8 border border-blue-200">
          <h2 className="text-2xl font-semibold mb-3 text-blue-900">Core Formula</h2>
          <div className="bg-white p-4 rounded-lg font-mono text-lg">
            Daily Water (mL) = TBW × 1.15 × Activity × Climate
          </div>
          <p className="text-gray-700 mt-3">
            Where TBW = Total Body Water (typically 60% of body weight for men, 55% for women)
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/library/supplements" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
            Next: Supplement Logic
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
