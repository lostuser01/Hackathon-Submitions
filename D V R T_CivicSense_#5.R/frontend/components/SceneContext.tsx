'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SceneContextType {
  section: number;
  setSection: (section: number) => void;
}

const SceneContext = createContext<SceneContextType>({
  section: 0,
  setSection: () => {},
});

export const useScene = () => useContext(SceneContext);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState(0);
  return (
    <SceneContext.Provider value={{ section, setSection }}>
      {children}
    </SceneContext.Provider>
  );
}
