"use client"

import { useState, useEffect } from 'react';

// Helper function to request permission for Device Orientation events on iOS 13+
// This must be triggered by a user gesture, like a click.
const requestDeviceOrientationPermission = async (): Promise<boolean> => {
  // Check if the API exists and is a function
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permissionState = await (DeviceOrientationEvent as any).requestPermission();
      return permissionState === 'granted';
    } catch (error) {
      console.error("DeviceOrientationEvent permission request failed:", error);
      return false;
    }
  }
  // For non-iOS 13+ devices or other browsers, permission is often granted by default
  return true;
};

export function InteractiveBackground() {
  // State for the gradient's inline style
  const [gradientStyle, setGradientStyle] = useState({
    background: 'linear-gradient(135deg, #14b8a6, #22d3ee)', // Default gradient (teal-500 to cyan-400)
  });

  // State to track permission and visibility of the button
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');

  const handlePermissionRequest = async () => {
    const granted = await requestDeviceOrientationPermission();
    if (granted) {
      setPermission('granted');
    } else {
      setPermission('denied');
      // Optionally, alert the user that it didn't work
      // alert("Permission for motion sensors was denied. The interactive background will not be enabled.");
    }
  };

  useEffect(() => {
    // Only add the event listener if permission has been granted
    if (permission !== 'granted') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event; // beta: front-back tilt, gamma: left-right tilt

      if (beta === null || gamma === null) return;

      // A simple but effective mapping of tilt to a gradient angle.
      // We combine the two axes to create a more fluid, 2D feel.
      const angle = 180 + (gamma || 0) + (beta || 0) / 2;

      setGradientStyle({
        background: `linear-gradient(${angle.toFixed(0)}deg, #14b8a6, #22d3ee)`,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permission]); // This effect runs only when the permission state changes

  return (
    <>
      {/* The button to enable the effect. It disappears after being clicked. */}
      {permission === 'idle' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}>
          <button
            onClick={handlePermissionRequest}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              cursor: 'pointer',
              color: 'white',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Enable Magic ✨
          </button>
        </div>
      )}

      {/* The background div itself, which will have its style updated */}
      <div
        className="fixed inset-0 w-full h-full z-[-2] transition-all duration-300 ease-linear"
        style={gradientStyle}
      />
    </>
  );
}
