import React, { useState, useEffect } from 'react';
import { X, MapPin, Database, Zap, ChevronRight } from 'lucide-react';
import { db, profileHelpers, settingsHelpers } from '@/lib/dexie-db';
import type { UserProfile, UserSettings } from '@/lib/dexie-db';

interface QuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile, settings: UserSettings) => void;
}

export default function QuizPopup({ isOpen, onClose, onComplete }: QuizPopupProps) {
  const [step, setStep] = useState<'loading' | 'consent' | 'profile' | 'complete'>('loading');
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);
  
  // Form data
  const [nickname, setNickname] = useState('');
  const [weight, setWeight] = useState(70);
  const [bodyType, setBodyType] = useState<'athletic' | 'average' | 'larger' | 'petite' | 'powerlifter' | 'runner' | 'swimmer' | 'dancer' | 'couch_potato'>('average');
  const [gpsConsent, setGpsConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(true);
  const [quickMode, setQuickMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingData();
    }
  }, [isOpen]);

  const loadExistingData = async () => {
    try {
      const profile = await profileHelpers.getOrCreateProfile();
      const settings = await settingsHelpers.getOrCreateSettings();
      
      if (profile) {
        // Existing user - load their data
        setExistingProfile(profile);
        setNickname(profile.nickname);
        setWeight(profile.weight);
        setBodyType(profile.bodyType);
        setGpsConsent(settings.gpsConsent);
        setDataConsent(settings.dataStorageConsent);
        setQuickMode(settings.quickMode);
        setStep('profile'); // Skip to profile confirmation
      } else {
        // New user - start with consent
        setStep('consent');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setStep('consent');
    }
  };

  const handleConsentSubmit = () => {
    setStep('profile');
  };

  const handleProfileSubmit = async () => {
    try {
      // Save profile
      await profileHelpers.saveProfile({
        nickname,
        weight,
        bodyType
      });

      // Save settings
      await settingsHelpers.updateSettings({
        gpsConsent,
        dataStorageConsent: dataConsent,
        quickMode
      });

      // Get the saved data
      const profile = await profileHelpers.getOrCreateProfile();
      const settings = await settingsHelpers.getOrCreateSettings();

      if (profile) {
        setStep('complete');
        setTimeout(() => {
          onComplete(profile, settings);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSkip = async () => {
    // Create minimal profile with defaults
    await profileHelpers.saveProfile({
      nickname: 'Hydration Seeker',
      weight: 150,
      bodyType: 'average'
    });

    const profile = await profileHelpers.getOrCreateProfile();
    const settings = await settingsHelpers.getOrCreateSettings();
    
    if (profile) {
      onComplete(profile, settings);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Loading State */}
        {step === 'loading' && (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <img src="/Artboard1.png" alt="Water Bar" className="w-20 h-20 mx-auto mb-4" />
              <p className="text-white/60">Loading your profile...</p>
            </div>
          </div>
        )}

        {/* Consent Step */}
        {step === 'consent' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Water Bar AI</h2>
            <p className="text-white/70 mb-6">Let's personalize your hydration journey</p>

            <div className="space-y-4">
              {/* GPS Consent */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-teal-400 focus:ring-teal-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span className="text-white font-medium">Enable Location Services</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Get local weather data and find nearby Water Bar venues for pickup
                    </p>
                  </div>
                </label>
              </div>

              {/* Data Storage Consent */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataConsent}
                    onChange={(e) => setDataConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-teal-400 focus:ring-teal-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">Store Data Locally</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Save your profile on this device only for instant loading (no cloud storage)
                    </p>
                  </div>
                </label>
              </div>

              {/* Quick Mode */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickMode}
                    onChange={(e) => setQuickMode(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-teal-400 focus:ring-teal-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-medium">Quick Mode</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Skip intros and get straight to recommendations
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 text-white/60 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleConsentSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Step */}
        {step === 'profile' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {existingProfile ? 'Welcome Back!' : 'Create Your Profile'}
            </h2>
            <p className="text-white/70 mb-6">
              {existingProfile ? 'Confirm your details' : 'Help us calculate your hydration needs'}
            </p>

            <div className="space-y-4">
              {/* Nickname */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Hydration Hero"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-white/80 text-sm mb-2">Body Type</label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="athletic">Athletic</option>
                  <option value="average">Average</option>
                  <option value="larger">Larger</option>
                  <option value="petite">Petite</option>
                  <option value="powerlifter">Powerlifter 💪</option>
                  <option value="runner">Runner 🏃</option>
                  <option value="swimmer">Swimmer 🏊</option>
                  <option value="dancer">Dancer 💃</option>
                  <option value="couch_potato">Couch Potato 🛋️</option>
                </select>
              </div>

              {/* LBM Preview */}
              <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm">Estimated Lean Body Mass</p>
                <p className="text-2xl font-bold text-white">
                  {profileHelpers.calculateLBM(weight, bodyType)} kg
                </p>
                <p className="text-white/40 text-xs mt-1">Used for hydration calculations</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 text-white/60 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleProfileSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
              >
                Start Coaching
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="p-8 text-center">
            <div className="animate-bounce mb-4">
              <img src="/Artboard1.png" alt="Water Bar" className="w-20 h-20 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Created!</h2>
            <p className="text-white/70">Connecting to your AI coach...</p>
          </div>
        )}
      </div>
    </div>
  );
}
