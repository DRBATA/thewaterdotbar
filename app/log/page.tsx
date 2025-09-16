'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Loader2, Check, X, Plus, AlertCircle } from 'lucide-react';

interface RecognizedItem {
  name: string;
  quantity: string;
  confidence: number;
  matched_id?: string;
  nutritionals?: {
    water_ml: number;
    sodium_mg: number;
    potassium_mg: number;
    magnesium_mg: number;
    soluble_fiber_g: number;
    insoluble_fiber_g: number;
    probiotic_cfu: number;
    omega3_mg: number;
    polyphenols_mg: number;
  };
}

interface DailyTotals {
  water_ml: number;
  sodium_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
  soluble_fiber_g: number;
  insoluble_fiber_g: number;
  probiotic_cfu: number;
  omega3_mg: number;
  polyphenols_mg: number;
}

export default function LogPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    water_ml: 0,
    sodium_mg: 0,
    potassium_mg: 0,
    magnesium_mg: 0,
    soluble_fiber_g: 0,
    insoluble_fiber_g: 0,
    probiotic_cfu: 0,
    omega3_mg: 0,
    polyphenols_mg: 0
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image with Vision AI
  const processImage = async (imageBase64: string) => {
    setIsProcessing(true);
    setRecognizedItems([]);
    
    try {
      // Call Vision AI API
      const response = await fetch('/api/vision/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      });

      if (response.ok) {
        const data = await response.json();
        setRecognizedItems(data.items);
      } else {
        // Mock data for testing
        setRecognizedItems([
          {
            name: 'Overnight oats with banana',
            quantity: '1 bowl (~300g)',
            confidence: 0.85,
            nutritionals: {
              water_ml: 200,
              sodium_mg: 50,
              potassium_mg: 400,
              magnesium_mg: 60,
              soluble_fiber_g: 6,
              insoluble_fiber_g: 3,
              probiotic_cfu: 0,
              omega3_mg: 100,
              polyphenols_mg: 50
            }
          },
          {
            name: 'Flaxseed',
            quantity: '1 tbsp (~10g)',
            confidence: 0.78,
            nutritionals: {
              water_ml: 0,
              sodium_mg: 3,
              potassium_mg: 81,
              magnesium_mg: 39,
              soluble_fiber_g: 1,
              insoluble_fiber_g: 2,
              probiotic_cfu: 0,
              omega3_mg: 2300,
              polyphenols_mg: 20
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Use mock data for demo
      setRecognizedItems([
        {
          name: 'Mixed salad',
          quantity: '1 plate',
          confidence: 0.72,
          nutritionals: {
            water_ml: 150,
            sodium_mg: 200,
            potassium_mg: 300,
            magnesium_mg: 30,
            soluble_fiber_g: 2,
            insoluble_fiber_g: 3,
            probiotic_cfu: 0,
            omega3_mg: 50,
            polyphenols_mg: 100
          }
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove an item from recognized list
  const removeItem = (index: number) => {
    setRecognizedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Add all items to daily log
  const addToLog = () => {
    // Calculate new totals
    const newTotals = { ...dailyTotals };
    recognizedItems.forEach(item => {
      if (item.nutritionals) {
        newTotals.water_ml += item.nutritionals.water_ml;
        newTotals.sodium_mg += item.nutritionals.sodium_mg;
        newTotals.potassium_mg += item.nutritionals.potassium_mg;
        newTotals.magnesium_mg += item.nutritionals.magnesium_mg;
        newTotals.soluble_fiber_g += item.nutritionals.soluble_fiber_g;
        newTotals.insoluble_fiber_g += item.nutritionals.insoluble_fiber_g;
        newTotals.probiotic_cfu += item.nutritionals.probiotic_cfu;
        newTotals.omega3_mg += item.nutritionals.omega3_mg;
        newTotals.polyphenols_mg += item.nutritionals.polyphenols_mg;
      }
    });
    
    setDailyTotals(newTotals);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setImagePreview(null);
      setRecognizedItems([]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Camera className="w-10 h-10 text-green-600" />
            Food & Drink Logger
          </h1>
          <p className="text-xl text-gray-600">
            Take a photo of your meal to automatically track nutritional intake
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Photo Upload Section */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Capture Your Meal</h2>
              
              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${imagePreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img 
                      src={imagePreview} 
                      alt="Food preview" 
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing image...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">Click to upload photo</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Recognized Items */}
              {recognizedItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recognized Items</h3>
                  <div className="space-y-2">
                    {recognizedItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              item.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                              item.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {Math.round(item.confidence * 100)}% confidence
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add to Log Button */}
                  <button
                    onClick={addToLog}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {showSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Log!
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add to Today's Log
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Tips for best results:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Take photos in good lighting</li>
                    <li>• Include all items in frame</li>
                    <li>• Show portion sizes clearly</li>
                    <li>• Separate mixed dishes if possible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Today's Totals</h2>
              
              <div className="space-y-4">
                {/* Hydration */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Hydration</h3>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Water</span>
                      <span className="font-semibold text-blue-600">{dailyTotals.water_ml} mL</span>
                    </div>
                  </div>
                </div>

                {/* Electrolytes */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Electrolytes</h3>
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sodium</span>
                        <span className="font-semibold text-orange-600">{Math.round(dailyTotals.sodium_mg)} mg</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Potassium</span>
                        <span className="font-semibold text-yellow-600">{Math.round(dailyTotals.potassium_mg)} mg</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Magnesium</span>
                        <span className="font-semibold text-purple-600">{Math.round(dailyTotals.magnesium_mg)} mg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gut Health */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Gut Health</h3>
                  <div className="space-y-2">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Soluble Fiber</span>
                        <span className="font-semibold text-green-600">{dailyTotals.soluble_fiber_g.toFixed(1)} g</span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Insoluble Fiber</span>
                        <span className="font-semibold text-emerald-600">{dailyTotals.insoluble_fiber_g.toFixed(1)} g</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Probiotics</span>
                        <span className="font-semibold text-indigo-600">
                          {dailyTotals.probiotic_cfu > 0 ? `${(dailyTotals.probiotic_cfu / 1000000000).toFixed(1)}B CFU` : '0 CFU'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Nutrients */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Advanced Nutrients</h3>
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Omega-3</span>
                        <span className="font-semibold text-blue-600">{Math.round(dailyTotals.omega3_mg)} mg</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Polyphenols</span>
                        <span className="font-semibold text-purple-600">{Math.round(dailyTotals.polyphenols_mg)} mg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gap Analysis Button */}
                <Link href="/?analyze=true" 
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors text-center block">
                  Analyze Gaps & Get Recommendations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
