"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[520px] bg-white/10 backdrop-blur-xl text-white border border-white/30 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-white">Your Personal Hydration Guide</DialogTitle>
          <DialogDescription className="text-stone-200">
            Discover your exact fluid needs with our AI-powered Water Barista
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-r from-blue-600/30 to-teal-600/30 p-4 border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/40 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Chat with our AI Water Barista</h3>
            </div>
            <p className="text-stone-100 ml-16">
              "Tell me about your goals, activity level, and I'll calculate your personalized hydration plan with exact fluid volumes."
            </p>
          </div>
          
          <h3 className="text-lg font-bold mb-2">How It Works:</h3>
          <ul className="space-y-3 text-stone-200 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">1.</span> 
              <span>Share your goals and lifestyle with our AI barista</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">2.</span> 
              <span>Get personalized recommendations for optimal hydration and nutrition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">3.</span> 
              <span>Discover functional drinks tailored to your needs:</span>
            </li>
          </ul>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">⚡</div>
              <div className="text-sm font-medium">Energy</div>
            </div>
            <div className="bg-purple-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">🧠</div>
              <div className="text-sm font-medium">Focus</div>
            </div>
            <div className="bg-indigo-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">😴</div>
              <div className="text-sm font-medium">Rest</div>
            </div>
          </div>
          
          <p className="text-sm text-stone-300 italic">
            Our AI recommends the perfect balance of drinks and meals for your optimal wellness journey
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
