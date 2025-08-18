"use client";

import { useEffect } from 'react';
import { initializeGpsBridgeSync } from '../lib/gps-bridge-sync';

/**
 * Client-side component to initialize GPS consent bridge sync
 * This ensures GPS consent from Dexie is synced to the bridge API
 */
export default function GpsBridgeSync() {
  useEffect(() => {
    // Initialize GPS bridge sync when component mounts
    initializeGpsBridgeSync().catch(error => {
      console.error('Failed to initialize GPS bridge sync:', error);
    });
  }, []);

  // This component renders nothing - it's just for side effects
  return null;
}
