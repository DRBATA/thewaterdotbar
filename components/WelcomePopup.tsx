"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [medicalDisclaimer, setMedicalDisclaimer] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
    }
  }, []);

  const handleContinue = () => {
    // Only proceed if both checkboxes are checked
    if (locationConsent && medicalDisclaimer) {
      // Request location permission if user consented
      if (locationConsent && navigator.geolocation) {
        setIsRequestingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Location successfully acquired
            console.log("Geolocation acquired:", position.coords.latitude, position.coords.longitude);
            setIsRequestingLocation(false);
            sessionStorage.setItem('hasSeenWelcomePopup', 'true');
            setIsOpen(false);
          },
          (error) => {
            // Error getting location - still close dialog but log the error
            console.error("Geolocation error:", error.message);
            setIsRequestingLocation(false);
            sessionStorage.setItem('hasSeenWelcomePopup', 'true');
            setIsOpen(false);
          }
        );
      } else {
        // If no location consent or geolocation not available, just close
        sessionStorage.setItem('hasSeenWelcomePopup', 'true');
        setIsOpen(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if both consents are given
      if (!open && locationConsent && medicalDisclaimer) {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenWelcomePopup', 'true');
      } else if (!open) {
        // If trying to close without consent, keep it open
        setIsOpen(true);
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="sm:max-w-[520px] bg-white/10 backdrop-blur-xl text-white border border-white/30 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-white">Perfect Your Functional Hydration</DialogTitle>
          <DialogDescription className="text-stone-200">
            AI-assisted advanced electrolyte optimization with premium Prana spring glacial water
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
              <h3 className="text-lg font-medium">Advanced AI Hydration Intelligence</h3>
            </div>
            <p className="text-stone-100 ml-16">
              "I can analyze your activity level, performance needs, and recovery goals to create a precision-targeted electrolyte and hydration plan that outperforms basic sports drinks."
            </p>
          </div>
          
          <h3 className="text-lg font-bold mb-2">Premium Hydration Science:</h3>
          <ul className="space-y-3 text-stone-200 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">1.</span> 
              <span>Superior electrolyte formulations with Prana spring glacial water base</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">2.</span> 
              <span>AI-generated hydration plans that outperform basic sports drinks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-300 font-bold">3.</span> 
              <span>Located at premium wellness venues throughout Dubai</span>
            </li>
          </ul>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-blue-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">🏃</div>
              <div className="text-sm font-medium">Performance</div>
            </div>
            <div className="bg-purple-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">⚡</div>
              <div className="text-sm font-medium">Electrolytes</div>
            </div>
            <div className="bg-indigo-600/20 p-2 rounded-md text-center">
              <div className="text-xl mb-1">🔄</div>
              <div className="text-sm font-medium">Recovery</div>
            </div>
          </div>
          
          <p className="text-sm text-stone-300 italic mb-6">
            Superior to basic electrolyte sachets — precision-formulated for optimal absorption with Prana spring glacial water
          </p>
          
          <div className="space-y-4 border-t border-white/20 pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="location-consent" 
                checked={locationConsent} 
                onCheckedChange={(checked) => setLocationConsent(checked as boolean)}
              />
              <label 
                htmlFor="location-consent" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-stone-200"
              >
                I allow The Water Bar to use my location to show the nearest venues with available drinks
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="medical-disclaimer" 
                checked={medicalDisclaimer} 
                onCheckedChange={(checked) => setMedicalDisclaimer(checked as boolean)}
              />
              <label 
                htmlFor="medical-disclaimer" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-stone-200"
              >
                I confirm I have no medical conditions that would be affected by the consumption of functional drinks
              </label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-black/20 px-6 py-4">
          <Button 
            onClick={handleContinue} 
            disabled={!locationConsent || !medicalDisclaimer || isRequestingLocation}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRequestingLocation ? 'Getting location...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
