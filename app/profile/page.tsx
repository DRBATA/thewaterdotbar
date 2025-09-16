'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Calculator, Droplets, Zap, Target, Info } from 'lucide-react';

interface BodyMetrics {
  weight: number;
  height: number;
  bodyFat: number;
  age: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  climate: 'temperate' | 'hot_dry' | 'hot_humid' | 'cold';
  specialConditions: {
    saunaUser: boolean;
    athlete: boolean;
    muscleBuilding: boolean;
    heavySweater: boolean;
  };
}

interface CalculatedTargets {
  lbm: number; // Lean Body Mass
  tbw: number; // Total Body Water
  icw: number; // Intracellular Water
  ecw: number; // Extracellular Water
  waterTarget: number; // Daily water in mL
  sodiumTarget: number; // Daily sodium in mg
  potassiumTarget: number; // Daily potassium in mg
  magnesiumTarget: number; // Daily magnesium in mg
  solubleFireTarget: number; // Soluble fiber in g
  insolubleFireTarget: number; // Insoluble fiber in g
  omega3Target: number; // Omega-3 in mg
  probioticTarget: number; // Probiotics in billion CFU
  polyphenolTarget: number; // Polyphenols in mg
}

export default function ProfilePage() {
  const [metrics, setMetrics] = useState<BodyMetrics>({
    weight: 70,
    height: 175,
    bodyFat: 15,
    age: 30,
    sex: 'male',
    activityLevel: 'moderate',
    climate: 'temperate',
    specialConditions: {
      saunaUser: false,
      athlete: false,
      muscleBuilding: false,
      heavySweater: false
    }
  });

  const [targets, setTargets] = useState<CalculatedTargets | null>(null);

  // Calculate targets whenever metrics change
  useEffect(() => {
    calculateTargets();
  }, [metrics]);

  const calculateTargets = () => {
    // Calculate Lean Body Mass
    const lbm = metrics.weight * (1 - metrics.bodyFat / 100);
    
    // Calculate Total Body Water (using Lean Body Mass method)
    const tbw = lbm * 0.73;
    
    // Calculate water compartments
    const icw = tbw * 0.65; // 65% of TBW
    const ecw = tbw * 0.35; // 35% of TBW
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.0,
      light: 1.2,
      moderate: 1.4,
      active: 1.6,
      very_active: 1.8
    };
    
    // Climate multipliers
    const climateMultipliers = {
      temperate: 1.0,
      hot_dry: 1.3,
      hot_humid: 1.4,
      cold: 1.1
    };
    
    const activityMultiplier = activityMultipliers[metrics.activityLevel];
    const climateMultiplier = climateMultipliers[metrics.climate];
    
    // Calculate daily water target
    let waterTarget = tbw * 1.15 * 1000 * activityMultiplier * climateMultiplier;
    if (metrics.specialConditions.saunaUser) waterTarget += 500;
    if (metrics.specialConditions.athlete) waterTarget *= 1.1;
    
    // Calculate electrolyte targets
    let sodiumTarget = lbm * 30 * activityMultiplier;
    if (metrics.specialConditions.heavySweater) sodiumTarget *= 1.5;
    
    const potassiumTarget = Math.max(lbm * 50, 3500); // Minimum 3500mg
    const magnesiumTarget = Math.min(Math.max(metrics.weight * 5, 300), 400); // 300-400mg range
    
    // Calculate fiber targets (adjusted for body size and activity)
    const solubleFireTarget = Math.max(15 + (lbm - 50) * 0.1, 15); // 15-18g
    const insolubleFireTarget = Math.max(12 + (lbm - 50) * 0.1, 12); // 12-15g
    
    // Fixed targets based on evidence
    const omega3Target = metrics.specialConditions.athlete ? 2000 : 1500;
    const probioticTarget = 10; // 10 billion CFU
    const polyphenolTarget = metrics.specialConditions.athlete ? 1000 : 750;
    
    setTargets({
      lbm: Math.round(lbm * 10) / 10,
      tbw: Math.round(tbw * 10) / 10,
      icw: Math.round(icw * 10) / 10,
      ecw: Math.round(ecw * 10) / 10,
      waterTarget: Math.round(waterTarget),
      sodiumTarget: Math.round(sodiumTarget),
      potassiumTarget: Math.round(potassiumTarget),
      magnesiumTarget: Math.round(magnesiumTarget),
      solubleFireTarget: Math.round(solubleFireTarget * 10) / 10,
      insolubleFireTarget: Math.round(insolubleFireTarget * 10) / 10,
      omega3Target: Math.round(omega3Target),
      probioticTarget: probioticTarget,
      polyphenolTarget: Math.round(polyphenolTarget)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <User className="w-10 h-10 text-purple-600" />
            Your Hydration Profile
          </h1>
          <p className="text-xl text-gray-600">
            Input your body metrics to calculate personalized daily targets
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Basic Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Body Metrics
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={metrics.weight}
                      onChange={(e) => setMetrics({...metrics, weight: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="30"
                      max="200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={metrics.height}
                      onChange={(e) => setMetrics({...metrics, height: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="120"
                      max="220"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Fat %
                    </label>
                    <input
                      type="number"
                      value={metrics.bodyFat}
                      onChange={(e) => setMetrics({...metrics, bodyFat: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="3"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={metrics.age}
                      onChange={(e) => setMetrics({...metrics, age: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="18"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biological Sex
                  </label>
                  <select
                    value={metrics.sex}
                    onChange={(e) => setMetrics({...metrics, sex: e.target.value as 'male' | 'female'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activity & Environment */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Activity & Environment
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Level
                  </label>
                  <select
                    value={metrics.activityLevel}
                    onChange={(e) => setMetrics({...metrics, activityLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="light">Light (1-3 days/week)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                    <option value="very_active">Very Active (2x/day)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Climate
                  </label>
                  <select
                    value={metrics.climate}
                    onChange={(e) => setMetrics({...metrics, climate: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="temperate">Temperate (15-25°C)</option>
                    <option value="hot_dry">Hot & Dry (>30°C, <40% humidity)</option>
                    <option value="hot_humid">Hot & Humid (>30°C, >60% humidity)</option>
                    <option value="cold">Cold (<5°C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Conditions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={metrics.specialConditions.saunaUser}
                        onChange={(e) => setMetrics({
                          ...metrics, 
                          specialConditions: {...metrics.specialConditions, saunaUser: e.target.checked}
                        })}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      Regular sauna user
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={metrics.specialConditions.athlete}
                        onChange={(e) => setMetrics({
                          ...metrics, 
                          specialConditions: {...metrics.specialConditions, athlete: e.target.checked}
                        })}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      Competitive athlete
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={metrics.specialConditions.muscleBuilding}
                        onChange={(e) => setMetrics({
                          ...metrics, 
                          specialConditions: {...metrics.specialConditions, muscleBuilding: e.target.checked}
                        })}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      Muscle building focus
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={metrics.specialConditions.heavySweater}
                        onChange={(e) => setMetrics({
                          ...metrics, 
                          specialConditions: {...metrics.specialConditions, heavySweater: e.target.checked}
                        })}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      Heavy sweater
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {targets && (
              <>
                {/* Body Composition Results */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Calculated Body Composition
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600">Lean Body Mass</p>
                      <p className="text-2xl font-bold text-purple-600">{targets.lbm} kg</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600">Total Body Water</p>
                      <p className="text-2xl font-bold text-blue-600">{targets.tbw} L</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600">Intracellular Water</p>
                      <p className="text-2xl font-bold text-cyan-600">{targets.icw} L</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-600">Extracellular Water</p>
                      <p className="text-2xl font-bold text-teal-600">{targets.ecw} L</p>
                    </div>
                  </div>
                </div>

                {/* Daily Targets */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Your Daily Targets
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Hydration */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Hydration</h3>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Water</span>
                          <span className="text-xl font-bold text-blue-600">{targets.waterTarget} mL</span>
                        </div>
                      </div>
                    </div>

                    {/* Electrolytes */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Electrolytes</h3>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Sodium</span>
                            <span className="text-lg font-semibold text-orange-600">{targets.sodiumTarget} mg</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Potassium</span>
                            <span className="text-lg font-semibold text-yellow-600">{targets.potassiumTarget} mg</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Magnesium</span>
                            <span className="text-lg font-semibold text-purple-600">{targets.magnesiumTarget} mg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gut Health */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Gut Health</h3>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Soluble Fiber</span>
                            <span className="text-lg font-semibold text-green-600">{targets.solubleFireTarget} g</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Insoluble Fiber</span>
                            <span className="text-lg font-semibold text-emerald-600">{targets.insolubleFireTarget} g</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Probiotics</span>
                            <span className="text-lg font-semibold text-indigo-600">{targets.probioticTarget}B CFU</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Nutrients */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Advanced Nutrients</h3>
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Omega-3</span>
                            <span className="text-lg font-semibold text-blue-600">{targets.omega3Target} mg</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Polyphenols</span>
                            <span className="text-lg font-semibold text-purple-600">{targets.polyphenolTarget} mg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Profile Note */}
        <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <p className="text-yellow-900">
            <strong>Note:</strong> Your profile is currently stored locally. 
            Sign in to save your profile across devices and enable personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
