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
  lbm: number;
  tbw: number;
  icw: number;
  ecw: number;
  waterTarget: number;
  sodiumTarget: number;
  potassiumTarget: number;
  magnesiumTarget: number;
  solubleFireTarget: number;
  insolubleFireTarget: number;
  omega3Target: number;
  probioticTarget: number;
  polyphenolTarget: number;
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

  useEffect(() => {
    calculateTargets();
  }, [metrics]);

  const calculateTargets = () => {
    const lbm = metrics.weight * (1 - metrics.bodyFat / 100);
    const tbw = lbm * 0.73;
    const icw = tbw * 0.65;
    const ecw = tbw * 0.35;
    
    const activityMultipliers = {
      sedentary: 1.0,
      light: 1.2,
      moderate: 1.4,
      active: 1.6,
      very_active: 1.8
    };
    
    const climateMultipliers = {
      temperate: 1.0,
      hot_dry: 1.3,
      hot_humid: 1.4,
      cold: 1.1
    };
    
    const activityMultiplier = activityMultipliers[metrics.activityLevel];
    const climateMultiplier = climateMultipliers[metrics.climate];
    
    let waterTarget = tbw * 1.15 * 1000 * activityMultiplier * climateMultiplier;
    if (metrics.specialConditions.saunaUser) waterTarget += 500;
    if (metrics.specialConditions.athlete) waterTarget *= 1.1;
    
    let sodiumTarget = lbm * 30 * activityMultiplier;
    if (metrics.specialConditions.heavySweater) sodiumTarget *= 1.5;
    
    const potassiumTarget = Math.max(lbm * 50, 3500);
    const magnesiumTarget = Math.min(Math.max(metrics.weight * 5, 300), 400);
    
    const solubleFireTarget = Math.max(15 + (lbm - 50) * 0.1, 15);
    const insolubleFireTarget = Math.max(12 + (lbm - 50) * 0.1, 12);
    
    const omega3Target = metrics.specialConditions.athlete ? 2000 : 1500;
    const probioticTarget = 10;
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
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Link>

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
          <div className="space-y-6">
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
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {targets && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Your Daily Targets
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Hydration</h3>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Water</span>
                        <span className="text-xl font-bold text-blue-600">{targets.waterTarget} mL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
