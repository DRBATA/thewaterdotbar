'use client';

import React, { useRef, useEffect } from 'react';

// --- Configuration Dials for Animation ---
const WAVE_SPEED = 0.02; // Speed of the wave animation
const WAVE_FREQ_1 = 15.0; // Spatial frequency of the first sine wave
const WAVE_FREQ_2 = 25.0; // Spatial frequency of the second sine wave
const SATURATION = 90; // Color saturation (0-100%)
const BASE_LIGHTNESS = 65; // Base color lightness (0-100%)
const PULSE_AMOUNT = 20; // How much the lightness pulses (0-50)
const OPACITY = 0.8; // Max opacity of the dots (0-1)

const HalftoneBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  let time = 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      if (!canvas.parentElement) return;
      const parentRect = canvas.parentElement.getBoundingClientRect();
      const gridSize = 50;

      // Calculate columns and rows to fill parent, plus a buffer
      const cols = Math.ceil(parentRect.width / gridSize) + 2;
      const rows = Math.ceil(parentRect.height / gridSize) + 2;

      const canvasWidth = cols * gridSize;
      const canvasHeight = rows * gridSize;

      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      ctx.scale(dpr, dpr);
    };

    const drawHalftoneWave = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      const gridSize = 50;

      const rows = Math.ceil(cssHeight / gridSize);
      const cols = Math.ceil(cssWidth / gridSize);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Center the dot within its grid cell
          const centerX = x * gridSize + gridSize / 2;
          const centerY = y * gridSize + gridSize / 2;

          const distanceFromCenter = Math.sqrt(
            Math.pow(centerX - cssWidth / 2, 2) +
              Math.pow(centerY - cssHeight / 2, 2)
          );
          const maxDistance = Math.sqrt(
            Math.pow(cssWidth / 2, 2) +
              Math.pow(cssHeight / 2, 2)
          );
          const normalizedDistance = distanceFromCenter / maxDistance;

          // Blend two sine waves for a more organic, complex ripple
          const wave1 = Math.sin(normalizedDistance * WAVE_FREQ_1 - time);
          const wave2 = Math.sin(normalizedDistance * WAVE_FREQ_2 + time * 0.5);
          const waveOffset = (wave1 + wave2) / 2 * 0.5 + 0.5; // Combine and normalize to 0-1 range

          // Calculate HSL color values
          const hue = (normalizedDistance * 200 - time * 30);
          const lightness = BASE_LIGHTNESS + waveOffset * PULSE_AMOUNT;

          ctx.beginPath();
          ctx.arc(centerX, centerY, waveOffset * (gridSize / 1.8), 0, 2 * Math.PI);
          ctx.fillStyle = `hsla(${hue}, ${SATURATION}%, ${lightness}%, ${waveOffset * OPACITY})`;
          ctx.fill();
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += WAVE_SPEED;
      drawHalftoneWave();
      animationFrameId.current = requestAnimationFrame(animate);
    };

    setupCanvas();
    animate();

    window.addEventListener('resize', setupCanvas);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-[-1] flex items-center justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default HalftoneBackground;
