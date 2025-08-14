"use client"

import React, { createContext, useContext, useState } from 'react';
import type { UserProfile, UserSettings } from '@/lib/dexie-db';

interface QuizContextType {
  showQuiz: boolean;
  showFlashCards: boolean;
  userProfile: UserProfile | null;
  userSettings: UserSettings | null;
  setShowQuiz: (show: boolean) => void;
  setShowFlashCards: (show: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserSettings: (settings: UserSettings | null) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFlashCards, setShowFlashCards] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  return (
    <QuizContext.Provider value={{
      showQuiz,
      showFlashCards,
      userProfile,
      userSettings,
      setShowQuiz,
      setShowFlashCards,
      setUserProfile,
      setUserSettings
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
