import React from 'react';
import Confetti from 'react-confetti';

interface DiscountConfettiProps {
  fire: boolean;
  onComplete: () => void;
}

const brandColors = ['#A7F3D0', '#14B8A6', '#FFFFFF', '#E0F2F1'];

export function DiscountConfetti({ fire, onComplete }: DiscountConfettiProps) {
  if (!fire) {
    return null;
  }

  return (
    <Confetti
      numberOfPieces={200}
      recycle={false}
      onConfettiComplete={onComplete}
      colors={brandColors}
      gravity={0.2}
      initialVelocityY={15}
      run={fire}
    />
  );
}
