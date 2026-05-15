'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BUILDING_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const POLE_GEOMETRY = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
const LAMP_GEOMETRY = new THREE.SphereGeometry(0.06, 6, 6);

const BUILDING_MATERIAL = new THREE.MeshStandardMaterial({
  metalness: 0.8,
  roughness: 0.2,
  emissive: '#1e3a8a',
  emissiveIntensity: 0.1,
});

const POLE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#475569' });
const LAMP_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#00F5FF',
  emissive: '#00F5FF',
  emissiveIntensity: 10,
});


export function SmartCity() {
  const buildingMeshRef = useRef<THREE.InstancedMesh>(null!);
  const poleMeshRef = useRef<THREE.InstancedMesh>(null!);
  const lampMeshRef = useRef<THREE.InstancedMesh>(null!);

  const buildings = useMemo(() => {
    const items = [];
    const colors = ['#334155', '#1e3a8a', '#312e81', '#1e40af', '#166534'];
    const tempColor = new THREE.Color();

    for (let x = -6; x <= 6; x += 1.2) {
      for (let z = -6; z <= 6; z += 1.2) {
        if (Math.abs(x) < 0.8 || Math.abs(z) < 0.8) continue;

        const height = 0.5 + Math.random() * 2.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const w = 0.4 + Math.random() * 0.4;
        const d = 0.4 + Math.random() * 0.4;

        items.push({
          position: [
            x + (Math.random() - 0.5) * 0.3,
            height / 2,
            z + (Math.random() - 0.5) * 0.3,
          ] as [number, number, number],
          scale: [w, height, d] as [number, number, number],
          color: tempColor.set(color).clone(),
        });
      }
    }
    return items;
  }, []);

  const streetLights = useMemo(() => [
    [-1.2, 0, -2.5], [1.2, 0, -2.5],
    [-1.2, 0, 2.5], [1.2, 0, 2.5],
    [-2.5, 0, -1.2], [-2.5, 0, 1.2],
    [2.5, 0, -1.2], [2.5, 0, 1.2],
    [-4, 0, -4], [4, 0, -4],
    [-4, 0, 4], [4, 0, 4],
  ].map(([x, , z]) => [x, 0, z] as [number, number, number]), []);

  useEffect(() => {
    const tempObject = new THREE.Object3D();
    
    // Set up buildings
    buildings.forEach((b, i) => {
      tempObject.position.set(...b.position);
      tempObject.scale.set(...b.scale);
      tempObject.updateMatrix();
      buildingMeshRef.current.setMatrixAt(i, tempObject.matrix);
      buildingMeshRef.current.setColorAt(i, b.color);
    });
    buildingMeshRef.current.instanceMatrix.needsUpdate = true;
    if (buildingMeshRef.current.instanceColor) buildingMeshRef.current.instanceColor.needsUpdate = true;

    // Set up poles
    streetLights.forEach((pos, i) => {
      tempObject.position.set(pos[0], 0.5, pos[2]);
      tempObject.scale.set(1, 1, 1);
      tempObject.updateMatrix();
      poleMeshRef.current.setMatrixAt(i, tempObject.matrix);
      
      // Set up lamps
      tempObject.position.set(pos[0], 1.05, pos[2]);
      tempObject.updateMatrix();
      lampMeshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    poleMeshRef.current.instanceMatrix.needsUpdate = true;
    lampMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildings, streetLights]);

  useFrame((state) => {
    // Subtle city-wide float/wobble for life, done on the group or whole instanced mesh
    const time = state.clock.elapsedTime;
    buildingMeshRef.current.position.y = Math.sin(time * 0.5) * 0.02;
  });

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#02040a" roughness={1} />
      </mesh>

      {/* Grid */}
      <gridHelper args={[30, 60, '#0e2040', '#0e2040']} position={[0, 0.01, 0]} />

      {/* Roads */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 0.6]} />
        <meshStandardMaterial color="#11111a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 0.6]} />
        <meshStandardMaterial color="#11111a" roughness={0.9} />
      </mesh>

      {/* Instanced Buildings */}
      <instancedMesh
        ref={buildingMeshRef}
        args={[BUILDING_GEOMETRY, BUILDING_MATERIAL, buildings.length]}
        castShadow
      />

      {/* Instanced Streetlights */}
      <instancedMesh
        ref={poleMeshRef}
        args={[POLE_GEOMETRY, POLE_MATERIAL, streetLights.length]}
      />
      <instancedMesh
        ref={lampMeshRef}
        args={[LAMP_GEOMETRY, LAMP_MATERIAL, streetLights.length]}
      />

      {/* Strategic soft glow lights instead of many point lights */}
      <pointLight position={[0, 10, 0]} color="#1e3a8a" intensity={2} distance={50} />
      <pointLight position={[5, 2, 5]} color="#7c3aed" intensity={1.5} distance={20} />
      <pointLight position={[-5, 2, -5]} color="#0891b2" intensity={1.5} distance={20} />

    </group>
  );
}