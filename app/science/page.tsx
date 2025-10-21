"use client"

import Link from 'next/link'
import { Brain, LineChart, Sparkles, Target, Zap } from 'lucide-react'

export default function ScienceOverviewPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">
          Science Meets AI
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We combine the latest scientific research with cutting-edge AI to provide 
          the most personalized hydration advice—tailored to your body, your activity, 
          and your unique needs.
        </p>
      </div>

      {/* How It Works Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Your Profile</h3>
            <p className="text-gray-600">
              We analyze your body composition, activity level, and sweat rate to calculate 
              your precise hydration needs—down to the milligram.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. AI Analysis</h3>
            <p className="text-gray-600">
              Our AI processes your intake, identifies nutritional gaps, and searches thousands 
              of product combinations to find the optimal solution for you.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Personalized Plan</h3>
            <p className="text-gray-600">
              Get specific drink and meal recommendations with detailed explanations of 
              exactly how each one addresses your unique deficits.
            </p>
          </div>
        </div>
      </div>

      {/* What Makes Us Different */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">What Makes Us Different</h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Calculations</h3>
              <p className="text-gray-700">
                Most hydration apps use basic formulas. We calculate your exact needs based on 
                lean body mass, activity type, ambient temperature, and sweat electrolyte concentration.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Multi-Nutrient Approach</h3>
              <p className="text-gray-700">
                We track 24 nutrients—not just water. Sodium, potassium, magnesium, protein, fiber, 
                B-vitamins, and more. Proper hydration is about balance, not just volume.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-700">
                Our AI uses constraint-based search to find the best product combinations from 
                available stock—respecting your dietary restrictions, preferences, and venue location.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Science Topics */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center">Explore the Science</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          Dive deeper into the research behind our recommendations
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/science/hydration"
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all"
          >
            <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-600 transition-colors">
              Hydration Fundamentals
            </h3>
            <p className="text-gray-600">
              Learn the symptoms of dehydration and what it means to be properly hydrated
            </p>
          </Link>

          <Link 
            href="/science/electrolytes"
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all"
          >
            <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-600 transition-colors">
              Electrolyte Balance
            </h3>
            <p className="text-gray-600">
              Why sodium, potassium, and magnesium matter more than you think
            </p>
          </Link>

          <Link 
            href="/science/protein"
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all"
          >
            <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-600 transition-colors">
              Protein & Water Retention
            </h3>
            <p className="text-gray-600">
              How protein helps your body hold onto the water it needs
            </p>
          </Link>

          <Link 
            href="/science/microbiome"
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all"
          >
            <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-600 transition-colors">
              Gut-Brain Connection
            </h3>
            <p className="text-gray-600">
              Fiber, neuropeptides, and the vagus nerve's role in wellness
            </p>
          </Link>

          <Link 
            href="/science/energy"
            className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all md:col-span-2"
          >
            <h3 className="text-xl font-semibold mb-2 group-hover:text-teal-600 transition-colors">
              Energy Production
            </h3>
            <p className="text-gray-600">
              The Krebs cycle and micronutrients needed for efficient energy use
            </p>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to optimize your hydration?</h2>
        <p className="text-lg mb-8 opacity-90">
          Get your personalized plan in minutes
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Your Assessment
        </Link>
      </div>
    </div>
  )
}
