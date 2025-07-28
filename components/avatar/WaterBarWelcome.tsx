'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mic, Droplets } from 'lucide-react';

interface WaterBarWelcomeProps {
  onStartSession: () => void;
  onClose?: () => void;
}

export function WaterBarWelcome({ onStartSession, onClose }: WaterBarWelcomeProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    onStartSession();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* Water Bar branding */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Droplets className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Meet Your Hydration Coach
        </h1>
        <p className="text-lg text-gray-600 max-w-md">
          Get personalized hydration advice, product recommendations, and create your perfect wellness plan
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Mic className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Voice Interaction</h3>
          <p className="text-sm text-gray-600">Natural conversation with your AI coach</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Droplets className="w-6 h-6 text-cyan-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Personalized Plans</h3>
          <p className="text-sm text-gray-600">Tailored hydration goals for your lifestyle</p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Smart Shopping</h3>
          <p className="text-sm text-gray-600">Voice-guided product selection</p>
        </div>
      </div>

      {/* Start button */}
      <Button
        onClick={handleStart}
        disabled={isLoading}
        size="lg"
        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Start Conversation
          </div>
        )}
      </Button>

      <p className="text-sm text-gray-500 mt-4 max-w-md">
        Your coach will help you calculate your daily hydration needs and recommend the perfect products for your goals
      </p>
    </div>
  );
}
