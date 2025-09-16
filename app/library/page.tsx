'use client';

import Link from 'next/link';
import { Brain, Droplets, Pill, FileText, ArrowRight } from 'lucide-react';

export default function LibraryPage() {
  const sections = [
    {
      title: 'The Gut-Brain Axis',
      description: 'How your microbiome influences mood, cognition, and overall health through bidirectional communication',
      icon: Brain,
      href: '/library/gut-brain',
      color: 'purple'
    },
    {
      title: 'Hydration Science',
      description: 'Precision hydration based on body composition, activity level, and environmental factors',
      icon: Droplets,
      href: '/library/hydration',
      color: 'blue'
    },
    {
      title: 'Supplement Logic',
      description: 'When whole foods fall short: Evidence-based supplementation to close nutritional gaps',
      icon: Pill,
      href: '/library/supplements',
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Science Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Evidence-based insights into hydration, nutrition, and the gut-brain connection. 
            Learn the science behind your personalized recommendations.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {sections.map((section) => {
            const Icon = section.icon;
            const colorClasses = {
              purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
              blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
              green: 'from-green-500 to-green-600 text-green-600 bg-green-50'
            };
            const colors = colorClasses[section.color as keyof typeof colorClasses];
            
            return (
              <Link key={section.href} href={section.href}>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full cursor-pointer group">
                  <div className={`h-2 rounded-t-xl bg-gradient-to-r ${colors.split(' ').slice(0, 2).join(' ')}`} />
                  <div className="p-6">
                    <div className={`inline-flex p-3 rounded-lg mb-4 ${colors.split(' ').slice(3).join(' ')}`}>
                      <Icon className={`w-8 h-8 ${colors.split(' ')[2]}`} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                      {section.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Key Concepts Summary */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Quick Reference</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Daily Targets</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex justify-between">
                  <span>Water:</span>
                  <span className="font-mono">TBW × 1.15 × Activity × Climate</span>
                </li>
                <li className="flex justify-between">
                  <span>Sodium:</span>
                  <span className="font-mono">LBM × 30mg × Activity</span>
                </li>
                <li className="flex justify-between">
                  <span>Potassium:</span>
                  <span className="font-mono">LBM × 50mg (min 3500mg)</span>
                </li>
                <li className="flex justify-between">
                  <span>Magnesium:</span>
                  <span className="font-mono">Weight × 5mg (300-400mg)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Gut Health Minimums</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex justify-between">
                  <span>Soluble Fiber:</span>
                  <span className="font-mono">15-18g/day</span>
                </li>
                <li className="flex justify-between">
                  <span>Insoluble Fiber:</span>
                  <span className="font-mono">12-15g/day</span>
                </li>
                <li className="flex justify-between">
                  <span>Probiotics:</span>
                  <span className="font-mono">10 billion CFU</span>
                </li>
                <li className="flex justify-between">
                  <span>Omega-3:</span>
                  <span className="font-mono">1000-2000mg EPA/DHA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Remember:</strong> These are baseline targets. Your personalized recommendations 
              will adjust based on your body composition, activity level, and environmental factors.
            </p>
          </div>
        </div>

        {/* Navigation Back */}
        <div className="mt-12 text-center">
          <Link href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-lg">
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
