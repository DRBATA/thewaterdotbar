'use client';

import Link from 'next/link';
import { ArrowLeft, Pill, AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export default function SupplementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Link href="/library" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Pill className="w-10 h-10 text-green-600" />
            Supplement Logic
          </h1>
          <p className="text-xl text-gray-600">
            When whole foods fall short: Evidence-based supplementation to close nutritional gaps
          </p>
        </div>

        {/* Key Concept Box */}
        <div className="bg-gradient-to-r from-green-100 to-amber-100 rounded-xl p-6 mb-8 border border-green-200">
          <h2 className="text-2xl font-semibold mb-3 text-green-900">Core Philosophy</h2>
          <p className="text-gray-800 leading-relaxed">
            <strong>Food First, Supplements Second.</strong> We use targeted supplementation only when 
            dietary intake analysis reveals specific gaps that cannot be practically filled through food alone.
          </p>
        </div>

        {/* Rite Gut Health Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Rite Gut Health</h3>
          <div className="mb-4 text-sm text-gray-600">
            <strong>Purpose:</strong> Soluble fiber supplementation for SCFA production
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">When Needed</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Soluble fiber intake &lt;10g/day</li>
                <li>• Taking probiotics without prebiotics</li>
                <li>• Low vegetable/fruit consumption</li>
                <li>• Digestive issues or IBS symptoms</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2">Key Ingredients</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Inulin (chicory root): 4-6g</li>
                <li>• Psyllium husk: 3-4g</li>
                <li>• Acacia fiber: 2-3g</li>
                <li>• Total: 10-12g soluble fiber/sachet</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Dosing:</strong> 1 sachet if diet has 5-10g soluble fiber | 
              2 sachets if diet has &lt;5g soluble fiber
            </p>
          </div>
        </section>

        {/* Rite Greens Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Rite Greens</h3>
          <div className="mb-4 text-sm text-gray-600">
            <strong>Purpose:</strong> Micronutrient density and phytonutrient diversity
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-2">When Needed</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• &lt;5 servings vegetables/day</li>
                <li>• Limited dietary variety</li>
                <li>• High oxidative stress (athletes)</li>
                <li>• Low polyphenol intake</li>
              </ul>
            </div>
            
            <div className="bg-lime-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lime-900 mb-2">Key Components</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Spirulina/Chlorella: B vitamins, iron</li>
                <li>• Matcha/Green tea: EGCG, L-theanine</li>
                <li>• Beetroot: Nitrates, betalains</li>
                <li>• Wheatgrass: Chlorophyll, minerals</li>
              </ul>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>Provides:</strong> 500-1000mg polyphenols | B6, B9, B12 | 
              Magnesium 50-100mg | Equivalent to 3-5 servings vegetables
            </p>
          </div>
        </section>

        {/* Humantra Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Humantra Electrolytes</h3>
          <div className="mb-4 text-sm text-gray-600">
            <strong>Purpose:</strong> Rapid electrolyte repletion for performance and recovery
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">When Needed</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Post-workout (&gt;1hr intense)</li>
                <li>• Sauna sessions</li>
                <li>• Hot climate exposure</li>
                <li>• Hangover recovery</li>
                <li>• Cramping issues</li>
              </ul>
            </div>
            
            <div className="bg-cyan-50 p-4 rounded-lg">
              <h4 className="font-semibold text-cyan-900 mb-2">Per Sachet</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Sodium: 500-700mg</li>
                <li>• Potassium: 200-300mg</li>
                <li>• Magnesium: 60-100mg</li>
                <li>• Chloride: 400-500mg</li>
              </ul>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-900">
              <strong>Note:</strong> Does NOT provide significant Vitamin D - 
              separate supplementation needed if deficient
            </p>
          </div>
        </section>

        {/* Decision Tree */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Supplement Decision Tree</h3>
          
          <div className="space-y-4">
            <div className="border-l-4 border-gray-300 pl-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Step 1: Analyze dietary intake</p>
                  <p className="text-sm text-gray-600">Photo log → Calculate totals → Identify gaps</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-gray-300 pl-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Step 2: Check against targets</p>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Fiber &lt;25g?</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700">Rite Gut Health</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Vegetables &lt;5 servings?</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700">Rite Greens</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Heavy sweating?</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700">Humantra</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-gray-300 pl-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Step 3: Smart stacking</p>
                  <p className="text-sm text-gray-600">
                    Morning: Rite Greens + breakfast<br/>
                    Post-workout: Humantra<br/>
                    Evening: Rite Gut Health with dinner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Special Populations */}
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Special Considerations</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2">Athletes</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• ↑ Humantra (2-3×/day training days)</li>
                <li>• ↑ Rite Greens (oxidative stress)</li>
                <li>• Consider creatine addition</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Vegans/Vegetarians</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• B12 supplementation critical</li>
                <li>• Iron absorption enhancers</li>
                <li>• Omega-3 from algae sources</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2">Elderly (&gt;65)</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• ↑ Protein requirements</li>
                <li>• Vitamin D essential</li>
                <li>• Gradual fiber increase</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Pregnancy/Lactation</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Consult healthcare provider</li>
                <li>• Folate critical</li>
                <li>• Adjust electrolyte needs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* References */}
        <section className="bg-gray-100 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Scientific References</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. Gibson GR et al. (2017). Expert consensus document: The International Scientific Association for Probiotics and Prebiotics (ISAPP) consensus statement on the definition and scope of prebiotics.</li>
            <li>2. Slavin J. (2013). Fiber and prebiotics: mechanisms and health benefits. Nutrients.</li>
            <li>3. Maughan RJ & Shirreffs SM. (2019). Muscle cramping during exercise: causes, solutions, and questions remaining. Sports Medicine.</li>
            <li>4. Zhang YJ et al. (2021). Impacts of gut bacteria on human health and diseases. International Journal of Molecular Sciences.</li>
            <li>5. Minich DM. (2019). A review of the science of colorful, plant-based food and practical strategies for "eating the rainbow". Journal of Nutrition and Metabolism.</li>
          </ol>
        </section>

        {/* Navigation */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/library" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
            Back to Library Home
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
