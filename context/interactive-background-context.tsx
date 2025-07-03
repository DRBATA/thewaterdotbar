"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types for our context ---
type PermissionState = 'idle' | 'granted' | 'denied';

interface InteractiveBackgroundContextType {
  permission: PermissionState;
  gradientStyle: React.CSSProperties;
  toggleMagic: () => void;
}

// --- Create the context with a default value ---
const InteractiveBackgroundContext = createContext<InteractiveBackgroundContextType | undefined>(
  undefined
);

// --- Helper function to request permission for Device Orientation events ---
const requestDeviceOrientationPermission = async (): Promise<boolean> => {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permissionState = await (DeviceOrientationEvent as any).requestPermission();
      return permissionState === 'granted';
    } catch (error) {
      console.error("DeviceOrientationEvent permission request failed:", error);
      return false;
    }
  }
  return true;
};

// --- The Provider component that will wrap our app ---
export function InteractiveBackgroundProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<PermissionState>('idle');
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({
    background: 'linear-gradient(135deg, #14b8a6, #22d3ee)', // Default gradient
  });

  const toggleMagic = async () => {
    if (permission === 'granted') {
      setPermission('idle'); // Turn it off
      // Reset to default gradient when turned off
      setGradientStyle({ background: 'linear-gradient(135deg, #14b8a6, #22d3ee)' });
    } else {
      const granted = await requestDeviceOrientationPermission();
      setPermission(granted ? 'granted' : 'denied');
    }
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta === null || gamma === null) return;

      const angle = 180 + (gamma || 0) + (beta || 0) / 2;
      setGradientStyle({
        background: `linear-gradient(${angle.toFixed(0)}deg, #14b8a6, #22d3ee)`,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permission]);

  const value = { permission, gradientStyle, toggleMagic };

  return (
    <InteractiveBackgroundContext.Provider value={value}>
      {/* The background div is now part of the provider itself */}
      <div
        className="fixed inset-0 w-full h-full z-[-2] transition-all duration-300 ease-linear"
        style={gradientStyle}
      />
      {children}
    </InteractiveBackgroundContext.Provider>
  );
}

// --- Custom hook for easy consumption of the context ---
export function useInteractiveBackground() {
  const context = useContext(InteractiveBackgroundContext);
  if (context === undefined) {
    throw new Error('useInteractiveBackground must be used within an InteractiveBackgroundProvider');
  }
  return context;
}
