'use client';

import { useState } from 'react';
import { ChevronRight, User, Droplets, Apple, ShoppingCart, CreditCard } from 'lucide-react';

interface Assessment {
  // Step 1: Body Type
  gender: 'male' | 'female' | '';
  bodyType: 'small' | 'medium' | 'large' | '';
  activityToday: 'none' | 'light' | 'moderate' | 'intense' | '';
  
  // Step 2: Today's Intake
  waterGlasses: number; // 250ml each
  coffee: boolean;
  tea: boolean;
  alcohol: boolean;
  
  // Step 3: Food intake
  hadBreakfast: 'none' | 'light' | 'full';
  hadLunch: 'none' | 'light' | 'full';
  fruitsVeggies: number; // servings
  
  // Step 4: Current state
  feelingThirsty: boolean;
  feelingTired: boolean;
  darkUrine: boolean;
  headache: boolean;
}

interface Recommendations {
  waterNeeded: number;
  electrolyteNeeded: boolean;
  fiberNeeded: boolean;
  products: Array<{
    name: string;
    quantity: number;
    reason: string;
  }>;
}

export default function StaffAssessmentPage() {
  const [step, setStep] = useState(1);
  const [assessment, setAssessment] = useState<Assessment>({
    gender: '',
    bodyType: '',
    activityToday: '',
    waterGlasses: 0,
    coffee: false,
    tea: false,
    alcohol: false,
    hadBreakfast: 'none',
    hadLunch: 'none',
    fruitsVeggies: 0,
    feelingThirsty: false,
    feelingTired: false,
    darkUrine: false,
    headache: false,
  });
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Calculate base water needs
  const calculateWaterNeeds = () => {
    // Base water calculation (ml)
    const bodyWeightEstimates = {
      'male-small': 65,
      'male-medium': 75,
      'male-large': 90,
      'female-small': 55,
      'female-medium': 65,
      'female-large': 75,
    };
    
    const key = `${assessment.gender}-${assessment.bodyType}` as keyof typeof bodyWeightEstimates;
    const estimatedWeight = bodyWeightEstimates[key] || 70;
    
    // 33ml per kg base
    let baseWater = estimatedWeight * 33;
    
    // Activity multiplier
    const activityMultipliers = {
      'none': 1.0,
      'light': 1.2,
      'moderate': 1.4,
      'intense': 1.6
    };
    baseWater *= activityMultipliers[assessment.activityToday as keyof typeof activityMultipliers] || 1.0;
    
    // Dehydration indicators add extra
    if (assessment.feelingThirsty) baseWater += 500;
    if (assessment.darkUrine) baseWater += 500;
    if (assessment.headache) baseWater += 300;
    
    // Subtract what they already had
    const consumedWater = assessment.waterGlasses * 250;
    const remainingWater = Math.max(0, baseWater - consumedWater);
    
    return Math.round(remainingWater);
  };

  // Analyze and generate recommendations
  const generateRecommendations = () => {
    const waterNeeded = calculateWaterNeeds();
    const products: any[] = [];
    
    // Water/Hydration products
    if (waterNeeded > 1500) {
      products.push({
        name: 'Coconut Water 500ml',
        quantity: 2,
        reason: 'High hydration need detected'
      });
      products.push({
        name: 'Humantra Electrolyte Sachet',
        quantity: 1,
        reason: 'Electrolyte replenishment needed'
      });
    } else if (waterNeeded > 750) {
      products.push({
        name: 'Kombucha 350ml',
        quantity: 1,
        reason: 'Moderate hydration + gut health'
      });
    }
    
    // Fiber assessment
    const fiberScore = 
      (assessment.hadBreakfast === 'full' ? 2 : assessment.hadBreakfast === 'light' ? 1 : 0) +
      (assessment.hadLunch === 'full' ? 2 : assessment.hadLunch === 'light' ? 1 : 0) +
      (assessment.fruitsVeggies * 2);
    
    if (fiberScore < 6) {
      products.push({
        name: 'Rite Gut Health Sachet',
        quantity: fiberScore < 3 ? 2 : 1,
        reason: 'Low fiber intake today'
      });
    }
    
    // Energy/Focus
    if (assessment.feelingTired && !assessment.coffee) {
      products.push({
        name: 'Cold Brew Coffee 250ml',
        quantity: 1,
        reason: 'Natural energy boost'
      });
    }
    
    // Micronutrients
    if (assessment.fruitsVeggies < 3) {
      products.push({
        name: 'Rite Greens Shot',
        quantity: 1,
        reason: 'Low vegetable intake'
      });
    }
    
    setRecommendations({
      waterNeeded,
      electrolyteNeeded: waterNeeded > 1500 || assessment.activityToday === 'intense',
      fiberNeeded: fiberScore < 6,
      products
    });
    
    setStep(5);
  };

  const nextStep = () => {
    if (step === 4) {
      generateRecommendations();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hydration Assessment
          </h1>
          <p className="text-gray-600">Quick 2-minute consultation</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Step 1: Body Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Basic Information
              </h2>

              <div>
                <label className="block text-gray-700 mb-3">Gender</label>
                <div className="grid grid-cols-2 gap-4">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setAssessment({ ...assessment, gender: g as any })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        assessment.gender === g
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {g === 'male' ? '♂️ Male' : '♀️ Female'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Body Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'small', label: 'Small', desc: '< 60kg' },
                    { value: 'medium', label: 'Medium', desc: '60-80kg' },
                    { value: 'large', label: 'Large', desc: '> 80kg' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAssessment({ ...assessment, bodyType: type.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        assessment.bodyType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Activity Today</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'none', label: 'No exercise' },
                    { value: 'light', label: 'Light (walk)' },
                    { value: 'moderate', label: 'Moderate (gym)' },
                    { value: 'intense', label: 'Intense (sports)' }
                  ].map((activity) => (
                    <button
                      key={activity.value}
                      onClick={() => setAssessment({ ...assessment, activityToday: activity.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        assessment.activityToday === activity.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {activity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hydration Today */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                Today's Hydration
              </h2>

              <div>
                <label className="block text-gray-700 mb-3">
                  Glasses of water (250ml each)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAssessment({ ...assessment, waterGlasses: Math.max(0, assessment.waterGlasses - 1) })}
                    className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-xl font-bold"
                  >
                    -
                  </button>
                  <div className="text-3xl font-bold w-16 text-center">{assessment.waterGlasses}</div>
                  <button
                    onClick={() => setAssessment({ ...assessment, waterGlasses: assessment.waterGlasses + 1 })}
                    className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Other drinks today</label>
                <div className="space-y-3">
                  {[
                    { key: 'coffee', label: '☕ Coffee' },
                    { key: 'tea', label: '🍵 Tea' },
                    { key: 'alcohol', label: '🍺 Alcohol' }
                  ].map((drink) => (
                    <label key={drink.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={assessment[drink.key as keyof Assessment] as boolean}
                        onChange={(e) => setAssessment({ ...assessment, [drink.key]: e.target.checked })}
                        className="w-5 h-5 mr-3 text-blue-600"
                      />
                      <span className="text-lg">{drink.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Food Intake */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Apple className="w-5 h-5 text-green-600" />
                Today's Nutrition
              </h2>

              <div>
                <label className="block text-gray-700 mb-3">Breakfast</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'none', label: 'Skipped' },
                    { value: 'light', label: 'Light' },
                    { value: 'full', label: 'Full meal' }
                  ].map((meal) => (
                    <button
                      key={meal.value}
                      onClick={() => setAssessment({ ...assessment, hadBreakfast: meal.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        assessment.hadBreakfast === meal.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {meal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Lunch</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'none', label: 'Skipped' },
                    { value: 'light', label: 'Light' },
                    { value: 'full', label: 'Full meal' }
                  ].map((meal) => (
                    <button
                      key={meal.value}
                      onClick={() => setAssessment({ ...assessment, hadLunch: meal.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        assessment.hadLunch === meal.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {meal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">
                  Servings of fruits/vegetables
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAssessment({ ...assessment, fruitsVeggies: Math.max(0, assessment.fruitsVeggies - 1) })}
                    className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-xl font-bold"
                  >
                    -
                  </button>
                  <div className="text-3xl font-bold w-16 text-center">{assessment.fruitsVeggies}</div>
                  <button
                    onClick={() => setAssessment({ ...assessment, fruitsVeggies: assessment.fruitsVeggies + 1 })}
                    className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Current State */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Current Symptoms</h2>
              
              <div className="space-y-3">
                {[
                  { key: 'feelingThirsty', label: '💧 Feeling thirsty' },
                  { key: 'feelingTired', label: '😴 Feeling tired/sluggish' },
                  { key: 'darkUrine', label: '🟡 Dark urine color' },
                  { key: 'headache', label: '🤕 Headache' }
                ].map((symptom) => (
                  <label key={symptom.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assessment[symptom.key as keyof Assessment] as boolean}
                      onChange={(e) => setAssessment({ ...assessment, [symptom.key]: e.target.checked })}
                      className="w-5 h-5 mr-3 text-blue-600"
                    />
                    <span className="text-lg">{symptom.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Recommendations */}
          {step === 5 && recommendations && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Your Personalized Recommendations
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-900 font-medium">
                  Additional water needed today: {recommendations.waterNeeded}ml
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Recommended Products:</h3>
                {recommendations.products.map((product, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {product.quantity}x {product.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{product.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!showPayment && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600"
                >
                  Add All to Cart & Generate Payment QR
                </button>
              )}

              {showPayment && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                  <p className="font-semibold text-gray-900 mb-2">Payment QR Code</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                      [Stripe QR Code]
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Customer scans to pay on their device
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && step < 5 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            )}
            {step < 5 && (
              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && (!assessment.gender || !assessment.bodyType || !assessment.activityToday))
                }
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ml-auto ${
                  (step === 1 && (!assessment.gender || !assessment.bodyType || !assessment.activityToday))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {step === 4 ? 'Get Recommendations' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
