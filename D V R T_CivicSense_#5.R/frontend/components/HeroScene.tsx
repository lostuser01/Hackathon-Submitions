// @ts-nocheck
'use client';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Preload, PerformanceMonitor, AdaptiveDpr, AdaptiveEvents, Bvh } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { SmartCity } from './SmartCity';
import { ComplaintPins } from './ComplaintPins';
import { DashboardHUD } from './DashboardHUD';
import { DataParticles } from './Particles';
import * as THREE from 'three';

const CONFIGS = [
  { pos: [0, 4, 8],    look: [0, 0, 0]  }, // 0: Hero
  { pos: [-4, 3, 6],   look: [-1, 0, 0] }, // 1: Mission
  { pos: [-3, 2, 5],   look: [-1, 0, 0] }, // 2: Ingress
  { pos: [0, 6, 4],    look: [0, 3, 0]  }, // 3: AI Core
  { pos: [3, 2, 5],    look: [1, 0, 0]  }, // 4: Resolution
  { pos: [-5, 1, 2],   look: [0, 0, 0]  }, // 5: Trust
  { pos: [5, 4, 2],    look: [0, 1, 0]  }, // 6: Departments
  { pos: [0, 10, 0.1], look: [0, 0, 0]  }, // 7: Security
  { pos: [-2, 5, -2],  look: [2, 0, 2]  }, // 8: Filler
  { pos: [4, 2, -4],   look: [-2, 1, 0] }, // 9: Extended
  { pos: [0, 2, 8],    look: [0, 0, 0]  }, // 10: Neural
  { pos: [-3, 8, 3],   look: [0, 0, 0]  }, // 11: Audit
  { pos: [3, 1, 3],    look: [-1, 0, -1]}, // 12: Rewards
  { pos: [0, 12, 5],   look: [0, 0, 0]  }, // 13: IoT
  { pos: [0, 5, 10],   look: [0, 0, 0]  }, // 14: CTA
];


function CameraRig({ section }: { section: number }) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(), []);
  const desiredLook = useMemo(() => new THREE.Vector3(), []);
  const newDir = useMemo(() => new THREE.Vector3(), []);
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const cfg = CONFIGS[Math.min(section, CONFIGS.length - 1)];
    targetPos.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    targetLook.set(cfg.look[0], cfg.look[1], cfg.look[2]);

    camera.position.lerp(targetPos, delta * 1.5);

    camera.getWorldDirection(currentLook);
    desiredLook.copy(targetLook).sub(camera.position).normalize();
    newDir.copy(currentLook).lerp(desiredLook, delta * 1.5);
    
    // Optimized lookAt without allocations
    lookAtTarget.copy(camera.position).add(newDir);
    camera.lookAt(lookAtTarget);
  });

  return null;
}


export function HeroScene({ section }: { section: number }) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className="hero-canvas"
      camera={{ position: [0, 4, 8], fov: 55 }}
      shadows={false}
      dpr={dpr}
      gl={{ 
        antialias: false, 
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        alpha: false,
      }}
    >
      <PerformanceMonitor onIncline={() => setDpr(1.5)} onDecline={() => setDpr(1.0)} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      
      <color attach="background" args={['#050816']} />
      <fog attach="fog" args={['#050816', 15, 45]} />



      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        color="#4040ff"
      />


      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <CameraRig section={section} />

      <Suspense fallback={null}>
        <Bvh firstHitOnly>
          <SmartCity />
          <ComplaintPins visible={section >= 1} />
          <DashboardHUD visible={section >= 2} />
          <DataParticles count={500} />
        </Bvh>
      </Suspense>


      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={1.0} intensity={0.8} radius={0.4} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
      
      <Preload all />
    </Canvas>
  );
}
