'use client';

import { useState } from 'react';
import { WaterBarAvatar } from './WaterBarAvatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone } from 'lucide-react';

export function AvatarTrigger() {
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setIsAvatarOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-40 flex items-center justify-center"
        size="lg"
      >
        <Phone className="w-6 h-6 text-white" />
      </Button>

      {/* Avatar popup */}
      <WaterBarAvatar 
        isOpen={isAvatarOpen} 
        onClose={() => setIsAvatarOpen(false)} 
      />
    </>
  );
}
