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
import { X } from 'lucide-react';
import Image from 'next/image';

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [medicalDisclaimer, setMedicalDisclaimer] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  useEffect(() => {
    // Popup is currently disabled
    // To re-enable, remove the next line and uncomment the code below
    return;
    
    /* 
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setIsOpen(true);
    }
    */
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    setIsOpen(false);
  };

  const handleContinue = () => {
    // Request location permission if user consented
    if (locationConsent && navigator.geolocation) {
      setIsRequestingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Location successfully acquired
          console.log("Geolocation acquired:", position.coords.latitude, position.coords.longitude);
          setIsRequestingLocation(false);
          handleClose();
        },
        (error) => {
          // Error getting location - still close dialog but log the error
          console.error("Geolocation error:", error.message);
          setIsRequestingLocation(false);
          handleClose();
        }
      );
    } else {
      // If no location consent or geolocation not available, just close
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[520px] bg-white/10 backdrop-blur-xl text-white border border-white/30 p-0">
        {/* Add X button */}
        <div className="absolute right-4 top-4">
          <button 
            onClick={handleClose}
            className="rounded-full bg-white/10 p-1 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4 text-white/70" />
          </button>
        </div>
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white text-center">Welcome to The Water Bar</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-0">
          <div className="mb-6 text-center">
            <p className="text-stone-100 mb-4">
              Discover premium functional hydration tailored to your wellness goals.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="location-consent" 
                checked={locationConsent} 
                onCheckedChange={(checked) => setLocationConsent(checked as boolean)}
              />
              <label 
                htmlFor="location-consent" 
                className="text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
              >
                Find locations near me with available drinks
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="medical-disclaimer" 
                checked={medicalDisclaimer} 
                onCheckedChange={(checked) => setMedicalDisclaimer(checked as boolean)}
              />
              <label 
                htmlFor="medical-disclaimer" 
                className="text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
              >
                I have no health concerns with functional ingredients
              </label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-black/20 px-6 py-4">
          <Button 
            onClick={handleContinue} 
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRequestingLocation ? 'Finding venues near you...' : 'Explore The Water Bar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
