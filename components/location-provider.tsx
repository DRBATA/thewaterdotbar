"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the location context shape
interface LocationContextType {
  userLocation: {
    lat: number | null;
    lng: number | null;
  };
  isLoading: boolean;
  error: string | null;
  calculateDistance: (venueLat?: number, venueLng?: number) => number;
}

// Default context values
const defaultLocationContext: LocationContextType = {
  userLocation: { lat: null, lng: null },
  isLoading: true,
  error: null,
  calculateDistance: () => 999, // Default to far away
};

// Create the context
const LocationContext = createContext<LocationContextType>(defaultLocationContext);

// Hook to use the location context
export const useLocation = () => useContext(LocationContext);

// Simple distance calculation function (Haversine formula)
function calculateDistanceFromCoords(lat1?: number | null, lon1?: number | null, lat2?: number, lon2?: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Default to far away if coordinates missing
  
  // Convert degrees to radians
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Radius of the earth in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

// Provider component
export function LocationProvider({ children, fallbackLocation }: { children: ReactNode; fallbackLocation?: { lat: number; lng: number } }) {
  const [userLocation, setUserLocation] = useState({ lat: null as number | null, lng: null as number | null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    // Default to fallback location if provided
    if (fallbackLocation) {
      setUserLocation({ lat: fallbackLocation.lat, lng: fallbackLocation.lng });
      setIsLoading(false);
      return;
    }

    if (!isBrowser) {
      setIsLoading(false);
      return;
    }

    // Only try to get location in browser environment
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Unable to retrieve your location. Using default location instead.");
          // Fall back to Dubai coordinates if geolocation fails
          setUserLocation({ lat: 25.2048, lng: 55.2708 });
          setIsLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Using default location instead.");
      // Fall back to Dubai coordinates if geolocation not supported
      setUserLocation({ lat: 25.2048, lng: 55.2708 });
      setIsLoading(false);
    }
  }, [isBrowser, fallbackLocation]);

  // Calculate distance function that uses the current user location
  const calculateDistance = (venueLat?: number, venueLng?: number) => {
    return calculateDistanceFromCoords(userLocation.lat, userLocation.lng, venueLat, venueLng);
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isLoading,
        error,
        calculateDistance
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
