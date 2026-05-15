'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useScene } from './SceneContext';

const HeroScene = dynamic(() => import('@/components/HeroScene').then(m => ({ default: m.HeroScene })), {
  ssr: false,
});

export function GlobalScene() {
  const pathname = usePathname();
  const { section } = useScene();

  // Determine active section based on route
  let activeSection = section;
  if (pathname.includes('/dashboard/admin')) {
    activeSection = 4; // Top-down overview
  } else if (pathname.includes('/dashboard/citizen')) {
    activeSection = 1; // Complaints focus
  } else if (pathname.includes('/dashboard/supervisor')) {
    activeSection = 2; // AI/HUD focus
  } else if (pathname !== '/') {
    activeSection = 4; // Default for other pages
  }

  return <HeroScene section={activeSection} />;
}

