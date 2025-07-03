"use client"

"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useInteractiveBackground } from '@/context/interactive-background-context';
import type { MenuItem } from '@/app/page';

interface WelcomePopupProps {
  onAddToCartAction: (item: MenuItem) => void;
}

export function WelcomePopup({ onAddToCartAction }: WelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { permission, toggleMagic } = useInteractiveBackground();

  useEffect(() => {
    // For testing: The popup will now appear on every page load.
    // The session storage check has been temporarily disabled.
    setIsOpen(true);
  }, []);

  const handleAddToCart = () => {
    // IMPORTANT: Replace with the actual product ID from your database/Stripe
    const dealItem: MenuItem = {
      id: 'price_1Rgcm4DrbIjw1y3S1h9DKfDR', // Final Stripe Price ID
      name: 'The Morning Party',
      description: 'Entry + Mocktail + Your Choice Of: Fire, Ice, Massage, or Float',
      price: 85,
      image: '/ticket.png', // Corrected property name
    };
    onAddToCartAction(dealItem); // Use the passed-in function
    setIsOpen(false); // Close the popup after adding to cart
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
        <DialogFooter className="p-6 pt-4 bg-stone-100 sm:justify-between">
          <Button variant="ghost" onClick={toggleMagic}>
            {permission === 'granted' ? 'Disable Magic 🪄' : 'Enable Magic ✨'}
          </Button>
          <Button onClick={handleAddToCart}>Add Deal to Cart - 85 DHS</Button>
        </DialogFooter>
        {/* The default 'X' is in the top-right corner. We ensure it's functional by using DialogClose if needed, but shadcn handles this well. */}
      </DialogContent>
    </Dialog>
  );
}
