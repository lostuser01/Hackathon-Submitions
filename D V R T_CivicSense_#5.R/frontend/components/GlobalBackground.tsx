'use client';
import dynamic from 'next/dynamic';
import { useScene } from '@/context/SceneContext';
import { Loader } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const HeroScene = dynamic(() => import('./HeroScene').then(m => ({ default: m.HeroScene })), {
  ssr: false,
});

export function GlobalBackground() {
  const { section, setSection } = useScene();
  const pathname = usePathname();

  // Reset or change camera based on path
  useEffect(() => {
    if (pathname === '/login' || pathname === '/signup') {
      setSection(100); // Special Auth Mode
    } else if (pathname === '/') {
      // Home page handles its own section via scroll
      // But we should reset it to 0 if we just came from auth
      if (section === 100) setSection(0);
    } else {
      setSection(0);
    }
  }, [pathname, setSection, section]);

  return (
    <>
      <div className="bg-scanner" />
      <HeroScene section={section} />
      <Loader />
    </>
  );
}
