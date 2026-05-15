'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SceneContextType {
  section: number;
  setSection: (s: number) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState(0);

  return (
    <SceneContext.Provider value={{ section, setSection }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}
