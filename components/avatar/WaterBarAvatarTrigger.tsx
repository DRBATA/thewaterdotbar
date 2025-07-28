'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Droplets } from 'lucide-react';
import { WaterBarAvatarApp } from './WaterBarAvatarApp';

export function WaterBarAvatarTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 z-40"
        size="lg"
      >
        <div className="flex flex-col items-center">
          <Droplets className="w-6 h-6 text-white mb-1" />
          <Mic className="w-4 h-4 text-white/80" />
        </div>
      </Button>

      {/* Avatar app modal */}
      {isOpen && (
        <WaterBarAvatarApp onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
