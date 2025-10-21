"use client"

import { AlertTriangle, CheckCircle, Droplet, TrendingUp } from 'lucide-react'

export default function HydrationPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Understanding Hydration</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your body is 60% water. Every cell, tissue, and organ depends on proper hydration 
          to function optimally. But what does that actually mean?
        </p>
      </div>

      {/* What Is Hydration */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">What Is Proper Hydration?</h2>
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8">
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Proper hydration isn't just about drinking water—it's about maintaining the right 
            <strong> fluid balance</strong> and <strong>electrolyte concentration</strong> in your cells and bloodstream.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Your body constantly loses water through breathing, sweating, and urination. To stay 
            properly hydrated, you need to replace not just the water, but also the minerals 
            (electrolytes) lost in the process.
          </p>
        </div>
      </section>

      {/* Signs of Proper Hydration */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Signs of Proper Hydration</h2>
        <p className="text-gray-600">
          When you're properly hydrated, your body functions optimally. Here's what that looks like:
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Clear, Pale Urine</h3>
                <p className="text-gray-600">
                  Light yellow or pale straw color indicates good hydration. Dark yellow suggests you need more fluids.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Consistent Energy</h3>
                <p className="text-gray-600">
                  Stable energy throughout the day without unexplained fatigue or brain fog.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Elastic Skin</h3>
                <p className="text-gray-600">
                  Pinch the skin on the back of your hand—it should bounce back quickly. Slow return indicates dehydration.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Normal Thirst</h3>
                <p className="text-gray-600">
                  Mild, manageable thirst—not excessive. Extreme thirst is a late sign of dehydration.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Regular Urination</h3>
                <p className="text-gray-600">
                  Urinating every 2-4 hours during the day. Less frequent can indicate inadequate fluid intake.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Clear Mind</h3>
                <p className="text-gray-600">
                  Mental clarity, good focus, and quick cognitive processing. Dehydration impairs brain function.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signs of Dehydration */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Warning Signs of Dehydration</h2>
        <p className="text-gray-600">
          Dehydration happens gradually. Here's what to watch for:
        </p>

        <div className="space-y-4">
          {/* Mild Dehydration */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <h3 className="text-xl font-semibold text-gray-900">Mild Dehydration (1-2% body weight loss)</h3>
            </div>
            <ul className="space-y-2 ml-9">
              <li className="text-gray-700">• Increased thirst and dry mouth</li>
              <li className="text-gray-700">• Slight fatigue and reduced motivation</li>
              <li className="text-gray-700">• Dark yellow urine</li>
              <li className="text-gray-700">• Mild headache</li>
              <li className="text-gray-700">• Reduced athletic performance</li>
            </ul>
          </div>

          {/* Moderate Dehydration */}
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <h3 className="text-xl font-semibold text-gray-900">Moderate Dehydration (3-5% body weight loss)</h3>
            </div>
            <ul className="space-y-2 ml-9">
              <li className="text-gray-700">• Very dry mouth and lips</li>
              <li className="text-gray-700">• Significant fatigue and weakness</li>
              <li className="text-gray-700">• Dizziness when standing</li>
              <li className="text-gray-700">• Reduced urine output (darker, less frequent)</li>
              <li className="text-gray-700">• Muscle cramps</li>
              <li className="text-gray-700">• Difficulty concentrating</li>
            </ul>
          </div>

          {/* Severe Dehydration */}
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="text-xl font-semibold text-gray-900">Severe Dehydration (>5% body weight loss)</h3>
            </div>
            <ul className="space-y-2 ml-9">
              <li className="text-gray-700">• Extreme thirst</li>
              <li className="text-gray-700">• Very dry skin and mucous membranes</li>
              <li className="text-gray-700">• Rapid heartbeat and breathing</li>
              <li className="text-gray-700">• Sunken eyes</li>
              <li className="text-gray-700">• Little or no urination</li>
              <li className="text-gray-700">• Confusion, irritability</li>
              <li className="text-gray-700 font-semibold">⚠️ Seek medical attention immediately</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How Much Water Do You Need */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">How Much Water Do You Actually Need?</h2>
        
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-8 space-y-4">
          <p className="text-lg text-gray-700 leading-relaxed">
            The old "8 glasses a day" rule is outdated and doesn't account for individual differences. 
            Your hydration needs depend on:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2">Body Composition</h4>
              <p className="text-sm text-gray-600">Lean muscle holds more water than fat tissue. Higher lean mass = higher water needs.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2">Activity Level</h4>
              <p className="text-sm text-gray-600">Exercise intensity and duration dramatically increase fluid and electrolyte loss.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2">Climate & Environment</h4>
              <p className="text-sm text-gray-600">Heat, humidity, and altitude all accelerate water loss through increased respiration and sweating.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold mb-2">Sweat Rate</h4>
              <p className="text-sm text-gray-600">Some people are "salty sweaters" and lose more electrolytes. This varies by genetics.</p>
            </div>
          </div>

          <div className="bg-teal-600 text-white rounded-lg p-6 mt-6">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="h-6 w-6" />
              <h4 className="text-lg font-semibold">Our Personalized Approach</h4>
            </div>
            <p className="text-teal-50">
              Instead of generic advice, we calculate your exact hydration needs based on your lean body mass, 
              activity intensity, session duration, and environmental factors. Then we track what you've 
              already consumed and recommend specific drinks to fill the gap.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-12 text-white">
        <Droplet className="h-16 w-16 mx-auto mb-4 opacity-80" />
        <h2 className="text-3xl font-bold mb-4">Get Your Personalized Hydration Plan</h2>
        <p className="text-lg mb-8 opacity-90">
          Answer a few questions and we'll calculate your exact needs
        </p>
        <a
          href="/"
          className="inline-block px-8 py-4 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Free Assessment
        </a>
      </div>
    </div>
  )
}
