'use client';

import Link from 'next/link';
import { ArrowLeft, Droplets, Calculator, Thermometer, Activity, ChevronRight } from 'lucide-react';

export default function HydrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Link href="/library" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Droplets className="w-10 h-10 text-blue-600" />
            Hydration Science
          </h1>
          <p className="text-xl text-gray-600">
            Precision hydration based on body composition, activity level, and environmental factors
          </p>
        </div>

        {/* Key Concept Box */}
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-6 mb-8 border border-blue-200">
          <h2 className="text-2xl font-semibold mb-3 text-blue-900">Core Formula</h2>
          <div className="bg-white p-4 rounded-lg font-mono text-lg">
            Daily Water (mL) = TBW × 1.15 × Activity × Climate
          </div>
          <p className="text-gray-700 mt-3">
            Where TBW = Total Body Water (typically 60% of body weight for men, 55% for women)
          </p>
        </div>

        {/* Body Composition Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Body Water Compartments
          </h3>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Total Body Water (TBW)</h4>
                <p className="text-gray-700 text-sm">
                  Sum of all water in the body
                </p>
                <p className="text-blue-600 font-semibold mt-2">
                  ~60% of body weight (men)<br/>
                  ~55% of body weight (women)
                </p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg">
                <h4 className="font-semibold text-cyan-900 mb-2">Intracellular Water (ICW)</h4>
                <p className="text-gray-700 text-sm">
                  Water inside cells (65% of TBW)
                </p>
                <p className="text-cyan-600 font-semibold mt-2">
                  Critical for cellular metabolism<br/>
                  Indicates muscle mass
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Extracellular Water (ECW)</h4>
              <p className="text-gray-700 text-sm">
                Water outside cells (35% of TBW) - includes blood plasma, lymph, interstitial fluid
              </p>
              <p className="text-green-600 font-semibold mt-2">
                ECW/TBW ratio &gt; 0.39 may indicate inflammation or edema
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Lean Body Mass (LBM) Method</h4>
              <div className="font-mono text-sm bg-white p-2 rounded mt-2">
                LBM = Weight × (1 - Body Fat %)<br/>
                TBW = LBM × 0.73
              </div>
            </div>
          </div>
        </section>

        {/* Multipliers Section */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-600" />
            Activity & Climate Multipliers
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Activity Levels</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Sedentary</span>
                  <span className="font-mono font-bold">1.0×</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Light (1-3 days/week)</span>
                  <span className="font-mono font-bold">1.2×</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Moderate (3-5 days/week)</span>
                  <span className="font-mono font-bold">1.4×</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span>Active (6-7 days/week)</span>
                  <span className="font-mono font-bold">1.6×</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-100 rounded">
                  <span>Very Active (2×/day)</span>
                  <span className="font-mono font-bold">1.8×</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Climate Factors</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Temperate (15-25°C)</span>
                  <span className="font-mono font-bold">1.0×</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>Hot Dry (>30°C, <40% humidity)</span>
                  <span className="font-mono font-bold">1.3×</span>
                </div>
                <div className="flex justify-between p-2 bg-red-100 rounded">
                  <span>Hot Humid (>30°C, >60% humidity)</span>
                  <span className="font-mono font-bold">1.4×</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>Cold (<5°C)</span>
                  <span className="font-mono font-bold">1.1×</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded">
                  <span>Sauna Use (add to base)</span>
                  <span className="font-mono font-bold">+500mL</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Electrolyte Calculations */}
        <section className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Electrolyte Requirements</h3>
          
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3">Daily Targets Based on LBM</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Sodium</p>
                  <p className="font-mono font-bold text-lg">LBM × 30mg</p>
                  <p className="text-xs text-gray-500 mt-1">×1.5 if heavy sweater</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Potassium</p>
                  <p className="font-mono font-bold text-lg">LBM × 50mg</p>
                  <p className="text-xs text-gray-500 mt-1">Min 3500mg/day</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-gray-600">Magnesium</p>
                  <p className="font-mono font-bold text-lg">Weight × 5mg</p>
                  <p className="text-xs text-gray-500 mt-1">300-400mg/day</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Sweat Loss Adjustments</h4>
              <p className="text-gray-700 text-sm mb-2">
                Average sweat contains: 900mg Na, 200mg K, 20mg Mg per liter
              </p>
              <div className="bg-white p-3 rounded font-mono text-sm">
                Heavy workout (1.5L sweat) = +1350mg Na, +300mg K, +30mg Mg
              </div>
            </div>
          </div>
        </section>

        {/* Practical Example */}
        <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-semibold mb-4">Example Calculation</h3>
          
          <div className="bg-white p-4 rounded-lg space-y-3">
            <div className="font-semibold text-gray-900">70kg Male, 15% body fat, Moderate activity, Hot climate</div>
            
            <div className="space-y-2 text-sm font-mono bg-gray-50 p-3 rounded">
              <div>LBM = 70kg × 0.85 = 59.5kg</div>
              <div>TBW = 59.5kg × 0.73 = 43.4L</div>
              <div>Base water = 43.4L × 1.15 = 49.9L = 2,870mL</div>
              <div>With multipliers = 2,870 × 1.4 × 1.3 = <span className="text-blue-600 font-bold">5,223mL/day</span></div>
            </div>

            <div className="space-y-2 text-sm font-mono bg-gray-50 p-3 rounded">
              <div>Sodium = 59.5 × 30 × 1.4 = <span className="text-orange-600 font-bold">2,499mg</span></div>
              <div>Potassium = 59.5 × 50 = <span className="text-green-600 font-bold">2,975mg</span></div>
              <div>Magnesium = 70 × 5 = <span className="text-purple-600 font-bold">350mg</span></div>
            </div>
          </div>
        </section>

        {/* References */}
        <section className="bg-gray-100 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Scientific References</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. EFSA Panel on Dietetic Products. (2010). Scientific Opinion on Dietary Reference Values for water.</li>
            <li>2. Institute of Medicine. (2005). Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate.</li>
            <li>3. Sawka MN et al. (2007). American College of Sports Medicine position stand: Exercise and fluid replacement.</li>
            <li>4. Baker LB. (2017). Sweating rate and sweat sodium concentration in athletes: A review of methodology and intra/interindividual variability. Sports Medicine.</li>
            <li>5. Wang Z et al. (1999). Hydration of fat-free body mass: review and critique of a classic body-composition constant. American Journal of Clinical Nutrition.</li>
          </ol>
        </section>

        {/* Navigation */}
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
