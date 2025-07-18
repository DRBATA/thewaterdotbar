import React from 'react';
import Confetti from 'react-confetti';

interface DiscountConfettiProps {
  fire: boolean;
  onComplete: () => void;
  tier?: {
    rate: number;
    code: string;
  } | null;
}

const brandColors = ['#A7F3D0', '#14B8A6', '#FFFFFF', '#E0F2F1'];

export function DiscountConfetti({ fire, onComplete, tier }: DiscountConfettiProps) {
  if (!fire) {
    return null;
  }

  return (
    <Confetti
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999
      }}
      numberOfPieces={tier ? 100 + Math.round(tier.rate * 1500) : 200}
      recycle={false}
      onConfettiComplete={onComplete}
      colors={brandColors}
      gravity={tier ? 0.15 + tier.rate * 0.5 : 0.2}
      initialVelocityY={tier ? 10 + tier.rate * 100 : 15}
      run={fire}
    />
  );
}
