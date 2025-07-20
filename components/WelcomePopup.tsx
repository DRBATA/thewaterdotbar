"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
    // Remove ability to close with escape key or clicking outside
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[520px] translate-x-[-50%] translate-y-[-50%] gap-4 bg-white/10 backdrop-blur-xl text-white border border-white/30 p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white text-center">Welcome to The Water Bar</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0">
          <div className="relative mb-6 rounded-lg overflow-hidden bg-gradient-to-r from-blue-600/30 to-teal-600/30 p-4 border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/40 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Advanced AI Hydration Intelligence</h3>
            </div>
            <p className="text-stone-100 ml-16">
              "I can analyze your activity level, performance needs, and recovery goals to create a precision-targeted hydration plan."
            </p>
          </div>
          
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
