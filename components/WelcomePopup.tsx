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
      <DialogContent className="sm:max-w-[480px] bg-stone-50 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-stone-900">Don't Miss Our Best Deal!</DialogTitle>
          <DialogDescription className="text-stone-600">
            Experience the full Morning Party for just 85 DHS.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="relative mb-4 rounded-lg overflow-hidden">
            <Image
              src="/ticket.png" // Make sure this image exists in your /public folder
              alt="The Morning Party Deal"
              width={480}
              height={270}
              className="w-full h-auto"
            />
          </div>
          <p className="text-base font-semibold text-stone-800">
            Entry + Mocktail + Your Choice Of:
          </p>
          <ul className="list-disc list-inside text-stone-700 mt-2 mb-4">
            <li>🔥 Fire (Infrared Sauna)</li>
            <li>🧊 Ice (Cold Plunge)</li>
            <li>💆‍♀️ Massage (10 minutes)</li>
            <li>💧 Float (15 minutes)</li>
          </ul>
          <p className="text-sm text-stone-500">
            📍 Johny Dar Experience, Al Quoz, Dubai | 🗓️ Sunday, 6th July | ⏰ 11 AM - 2 PM
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
