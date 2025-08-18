import React, { useState, useEffect } from 'react';
import { X, Thermometer, Droplets, Zap, Activity, MapPin } from 'lucide-react';
import { db, targetHelpers, profileHelpers, settingsHelpers } from '@/lib/dexie-db';
import type { UserProfile, UserSettings, HydrationTarget } from '@/lib/dexie-db';

interface FlashCardsProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  userSettings: UserSettings | null;
}

interface WeatherData {
  temp: number;
  humidity: number;
  location: string;
  description: string;
}

interface DailyTargets {
  water: number; // ml
  sodium: number; // mg
  potassium: number; // mg
  currentIntake: number; // ml consumed so far
}

export default function FlashCards({ isOpen, onClose, userProfile, userSettings }: FlashCardsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      loadTargetsAndWeather();
    }
  }, [isOpen, userProfile]);

  const loadTargetsAndWeather = async () => {
    setLoading(true);
    
    try {
      // Load or calculate daily targets
      await calculateDailyTargets();
      
      // Get weather if GPS consent given
      if (userSettings?.gpsConsent) {
        await fetchWeatherData();
      }
    } catch (error) {
      console.error('Error loading flash card data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyTargets = async () => {
    if (!userProfile) return;

    // Base hydration calculation using profileHelpers (same as QuizPopup)
    const weight = userProfile.weight || 70;
    const bodyType = userProfile.bodyType || 'average';
    const gender = userProfile.gender || 'prefer_not_to_say';
    
    // Use the same LBM calculation as QuizPopup
    const lbm = profileHelpers.calculateLBM(weight, bodyType, gender);
    const totalWater = Math.round(lbm * 35); // 35ml per kg of LBM
    
    // Electrolyte targets based on water intake
    const sodium = Math.round(totalWater * 0.5); // ~0.5mg per ml of water
    const potassium = Math.round(totalWater * 0.8); // ~0.8mg per ml of water
    
    // Get current intake from Dexie
    const todayTarget = await targetHelpers.getTodayTarget();
    const currentIntake = todayTarget?.currentIntake || 0;
    
    const calculatedTargets: DailyTargets = {
      water: totalWater,
      sodium,
      potassium,
      currentIntake
    };
    
    setTargets(calculatedTargets);
    
    // Save to Dexie for persistence
    await targetHelpers.saveTodayTarget({
      baseTarget: totalWater,
      currentIntake,
      deficit: Math.max(0, totalWater - currentIntake),
      fireVsIce: 'balanced', // Will be enhanced with weather
      products: []
    });
  };

  const fetchWeatherData = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Using OpenWeatherMap API (you'll need to add API key to .env.local)
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) {
        console.warn('Weather API key not configured');
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Weather API failed');
      }
      
      const data = await response.json();
      
      setWeather({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        location: data.name,
        description: data.weather[0].description
      });
      
      // Recalculate targets with weather adjustment
      await adjustTargetsForWeather(data.main.temp, data.main.humidity);
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      setLocationError('Unable to get weather data');
    }
  };

  const adjustTargetsForWeather = async (temp: number, humidity: number) => {
    if (!targets || !userProfile) return;

    // Temperature adjustment factor
    let tempFactor = 1.0;
    if (temp > 80) tempFactor = 1.3; // Hot weather
    else if (temp > 70) tempFactor = 1.1; // Warm weather
    else if (temp < 40) tempFactor = 0.9; // Cold weather

    // Humidity adjustment
    let humidityFactor = 1.0;
    if (humidity > 70) humidityFactor = 1.2; // High humidity
    else if (humidity < 30) humidityFactor = 1.1; // Low humidity (dry air)

    const weatherMultiplier = tempFactor * humidityFactor;
    const adjustedWater = Math.round(targets.water * weatherMultiplier);
    const adjustedSodium = Math.round(targets.sodium * weatherMultiplier);
    const adjustedPotassium = Math.round(targets.potassium * weatherMultiplier);

    const adjustedTargets: DailyTargets = {
      ...targets,
      water: adjustedWater,
      sodium: adjustedSodium,
      potassium: adjustedPotassium
    };

    setTargets(adjustedTargets);

    // Update Dexie with weather-adjusted targets
    await targetHelpers.saveTodayTarget({
      baseTarget: adjustedWater,
      currentIntake: targets.currentIntake,
      deficit: Math.max(0, adjustedWater - targets.currentIntake),
      fireVsIce: temp > 75 ? 'ice' : temp < 50 ? 'fire' : 'balanced',
      products: []
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-t-2xl shadow-2xl border border-white/10 overflow-hidden"
        style={{
          animation: 'slideUp 0.3s ease-out',
          animationFillMode: 'both'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Today's Target</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4"></div>
              <p className="text-white/60">Calculating your targets...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Weather Card */}
            {weather && (
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">Current Conditions</span>
                  </div>
                  <div className="flex items-center space-x-1 text-white/60 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{weather.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{weather.temp}°F</p>
                    <p className="text-white/60 text-sm capitalize">{weather.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80">Humidity</p>
                    <p className="text-xl font-bold text-cyan-400">{weather.humidity}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Info */}
            {userProfile && (
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span className="text-white font-medium">Your Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Nickname</p>
                    <p className="text-lg font-bold text-white">{userProfile.nickname || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Weight</p>
                    <p className="text-lg font-bold text-white">{userProfile.weight || 'Not set'} kg</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Body Type</p>
                    <p className="text-lg font-bold text-white capitalize">{userProfile.bodyType || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Lean Body Mass</p>
                    <p className="text-lg font-bold text-indigo-400">
                      {userProfile.lbm || profileHelpers.calculateLBM(userProfile.weight || 70, userProfile.bodyType || 'average', userProfile.gender || 'prefer_not_to_say')} kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hydration Target */}
            {targets && (
              <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-lg p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-3">
                  <Droplets className="w-5 h-5 text-teal-400" />
                  <span className="text-white font-medium">Water Target</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{targets.water}ml</p>
                    <p className="text-white/60 text-sm">Total daily goal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80">Base Target</p>
                    <p className="text-xl font-bold text-teal-400">Daily Goal</p>
                  </div>
                </div>
              </div>
            )}


            {/* Location Error */}
            {locationError && !weather && (
              <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                <p className="text-yellow-200 text-sm">
                  {locationError}. Using default calculations.
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all mt-4"
            >
              Start Hydrating
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
