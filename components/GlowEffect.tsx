'use client';

import React, { useRef, useEffect } from 'react';

// --- Base Configuration Dials for Light Streaks ---
const BASE_NUM_STREAKS = 8; // Number of streaks for intensity = 1
const BASE_SPEED = 0.3; // Base speed of horizontal drift
const HUE_SHIFT_SPEED = 0.2; // Speed of color change
const STREAK_WIDTH_MIN = 2; // Minimum width of a streak
const STREAK_WIDTH_MAX = 6; // Maximum width of a streak
const BASE_OPACITY_MAX = 0.7;

interface GlowEffectProps {
  intensity: number;
}

interface Streak {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hue: number;
  opacity: number;
}

const GlowEffect: React.FC<GlowEffectProps> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streaksRef = useRef<Streak[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (intensity <= 0 || !canvas) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const NUM_STREAKS = Math.floor(BASE_NUM_STREAKS * intensity);
    const OPACITY_MAX = Math.min(1, BASE_OPACITY_MAX * Math.sqrt(intensity));

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      streaksRef.current = [];

      for (let i = 0; i < NUM_STREAKS; i++) {
        streaksRef.current.push({
          x: Math.random() * rect.width,
          y: 0,
          width: STREAK_WIDTH_MIN + Math.random() * (STREAK_WIDTH_MAX - STREAK_WIDTH_MIN),
          height: rect.height,
          speed: (Math.random() - 0.5) * BASE_SPEED,
          hue: Math.random() * 360,
          opacity: (0.1 + Math.random() * OPACITY_MAX),
        });
      }
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        animationFrameId.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, rect.width, rect.height);

      streaksRef.current.forEach((streak: Streak) => {
        streak.x += streak.speed;
        streak.hue += HUE_SHIFT_SPEED;

        if (streak.x < -streak.width) streak.x = rect.width;
        if (streak.x > rect.width) streak.x = -streak.width;

        const gradient = ctx.createLinearGradient(streak.x, streak.y, streak.x, streak.y + streak.height);
        const color = `hsla(${streak.hue}, 80%, 70%, ${streak.opacity})`;
        const transparent = `hsla(${streak.hue}, 80%, 70%, 0)`;
        
        gradient.addColorStop(0, transparent);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, transparent);

        ctx.fillStyle = gradient;
        ctx.fillRect(streak.x, streak.y, streak.width, streak.height);
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };

    setup();
    draw();

    const resizeListener = () => setup();
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [intensity]);

  if (intensity <= 0) {
    return null;
  }

  const brightness = 150 + intensity * 15;
  const blurValue = intensity > 3 ? '16px' : '12px'; // Use pixel values for direct style application

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full z-10 mix-blend-screen`} // Use z-10 to bring canvas on top of the image
      style={{ 
        backgroundColor: 'transparent',
        // Combine all filters into one property to avoid override issues
        filter: `blur(${blurValue}) saturate(150%) brightness(${brightness}%)`
      }}
    />
  );
};

export default GlowEffect;
