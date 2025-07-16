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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999
      }}
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
