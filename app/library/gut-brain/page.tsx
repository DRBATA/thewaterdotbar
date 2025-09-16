'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Microscope, Pill, ChevronRight } from 'lucide-react';

export default function GutBrainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Link href="/library" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Brain className="w-10 h-10 text-purple-600" />
            The Gut-Brain Axis
          </h1>
          <p className="text-xl text-gray-600">
            How your microbiome influences mood, cognition, and overall health through bidirectional communication
          </p>
        </div>

        {/* Key Concept Box */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8 border border-purple-200">
          <h2 className="text-2xl font-semibold mb-3 text-purple-900">Core Principle</h2>
          <p className="text-gray-800 leading-relaxed">
            <strong>90-95% of your body's serotonin is made in the gut</strong> by enterochromaffin cells. 
            This "second brain" (enteric nervous system) contains 500 million neurons and communicates with 
            your brain via the vagus nerve, immune signaling, and microbial metabolites.
          </p>
        </div>

        {/* Science Sections */}
        <div className="space-y-8">
          {/* Section 1: SCFA Production */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Microscope className="w-6 h-6 text-green-600" />
              Short-Chain Fatty Acids (SCFAs)
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">The Process:</h4>
                <p className="text-gray-700 mb-3">
                  Soluble fiber (inulin, pectin, beta-glucans) → Bacterial fermentation → 
                  SCFAs (butyrate, propionate, acetate)
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why It Matters:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-green-500" />
                    <span><strong>Butyrate:</strong> Primary fuel for colonocytes, strengthens gut barrier, reduces inflammation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-green-500" />
                    <span><strong>Propionate:</strong> Regulates cholesterol synthesis, improves insulin sensitivity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-green-500" />
                    <span><strong>Acetate:</strong> Crosses blood-brain barrier, influences appetite regulation</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>Daily Target:</strong> 15-18g soluble fiber to maintain SCFA production
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Vagal Signaling */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-2xl font-semibold mb-4">Vagus Nerve Communication</h3>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                The vagus nerve is the superhighway between gut and brain, carrying 80% of signals 
                FROM gut TO brain (afferent).
              </p>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Evidence from Research:</h4>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700">
                    <strong>Mouse Study (Bravo et al., 2011):</strong> Lactobacillus rhamnosus JB-1 
                    altered GABA receptor expression and reduced anxiety-like behavior. Effect was 
                    eliminated by vagotomy (cutting vagus nerve).
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    Note: Animal model - human translation pending clinical trials
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Practical Application:</h4>
                <p className="text-gray-700">
                  Probiotics (10+ billion CFU) + Prebiotics (fiber) = Enhanced vagal tone = 
                  Better stress resilience and mood regulation
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Practical Day Examples */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-2xl font-semibold mb-4">Real-World Application</h3>
            
            <div className="space-y-6">
              {/* Good Day Example */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">✅ Naturally Covered Day</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Breakfast:</strong> Overnight oats + banana + flaxseed (6g soluble, 3g insoluble)</div>
                  <div><strong>Snack:</strong> Kefir 250ml (probiotics + B12)</div>
                  <div><strong>Lunch:</strong> Lentil salad with veggies (7g soluble, 4g insoluble)</div>
                  <div><strong>Dinner:</strong> Salmon + broccoli + quinoa (4g mixed fiber)</div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="font-semibold text-green-900">
                    Result: 30g fiber (16g soluble, 14g insoluble) + probiotics = Optimal SCFA production
                  </p>
                </div>
              </div>

              {/* Gap Day Example */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-3">❌ Modern Convenience Day</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Breakfast:</strong> Coffee + croissant (minimal fiber)</div>
                  <div><strong>Snack:</strong> Kefir 250ml (probiotics but no food for them)</div>
                  <div><strong>Lunch:</strong> Chicken wrap, white bread (3g fiber, mostly insoluble)</div>
                  <div><strong>Dinner:</strong> Steak + mashed potatoes (minimal fiber)</div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="font-semibold text-red-900">
                    Result: 7-8g fiber (2g soluble) = Poor SCFA production
                  </p>
                  <p className="text-green-700 mt-2">
                    <strong>Solution:</strong> Add Rite Gut Health (8-12g soluble fiber) to feed microbiome
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* References */}
          <section className="bg-gray-100 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Scientific References</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. Gershon MD. (2013). The enteric nervous system: a second brain. Hospital Practice.</li>
              <li>2. Bravo JA et al. (2011). Ingestion of Lactobacillus strain regulates emotional behavior and central GABA receptor expression in a mouse via the vagus nerve. PNAS.</li>
              <li>3. Koh A et al. (2016). From dietary fiber to host physiology: short-chain fatty acids as key bacterial metabolites. Cell.</li>
              <li>4. Cryan JF & Dinan TG. (2012). Mind-altering microorganisms: the impact of the gut microbiota on brain and behaviour. Nature Reviews Neuroscience.</li>
              <li>5. Silva YP et al. (2020). The role of short-chain fatty acids from gut microbiota in gut-brain communication. Frontiers in Endocrinology.</li>
            </ol>
          </section>
        </div>

        {/* Navigation to next section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link href="/library/hydration" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
            Next: Hydration Science
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
