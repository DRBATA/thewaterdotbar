"use client"

import React from 'react';
import { QuizProvider } from '@/contexts/QuizContext';
import QuizPopup from '@/components/QuizPopup';
import FlashCards from '@/components/FlashCards';
import { useQuiz } from '@/contexts/QuizContext';
import type { UserProfile, UserSettings } from '@/lib/dexie-db';

// Inner component that uses the quiz context
function QuizModals() {
  const { 
    showQuiz, 
    setShowQuiz, 
    showFlashCards, 
    setShowFlashCards,
    userProfile,
    userSettings,
    setUserProfile,
    setUserSettings
  } = useQuiz();

  const handleQuizComplete = (profile: UserProfile, settings: UserSettings) => {
    setUserProfile(profile);
    setUserSettings(settings);
    setShowQuiz(false);
  };

  return (
    <>
      {/* Quiz Popup - Now renders at page level */}
      <QuizPopup 
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
      
      {/* Flash Cards - Now renders at page level */}
      <FlashCards 
        isOpen={showFlashCards}
        onClose={() => setShowFlashCards(false)}
        userProfile={userProfile}
        userSettings={userSettings}
      />
    </>
  );
}

// Main wrapper component
export default function PageClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QuizProvider>
      {children}
      <QuizModals />
    </QuizProvider>
  );
}
