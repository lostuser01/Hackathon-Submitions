'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

const NODE_GEOMETRY = new THREE.OctahedronGeometry(0.15, 0);
const RING_GEOMETRY_1 = new THREE.TorusGeometry(1.8, 0.01, 8, 64);
const RING_GEOMETRY_2 = new THREE.TorusGeometry(2.2, 0.008, 8, 64);

function HolographicNode({ position, color, label }: {
  position: [number, number, number];
  color: string;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.8;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.6;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={NODE_GEOMETRY}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          wireframe
        />
      </mesh>
      <pointLight color={color} intensity={0.4} distance={1.5} />
      <Html center position={[0, 0.3, 0]}>
        <div style={{
          fontSize: '9px',
          color,
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${color}`,
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function ConnectionLine({ start, end, color }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} transparent opacity={0.3} />
    </line>
  );
}


export function DashboardHUD({ visible = false }: { visible?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  const nodes = useMemo(() => [
    { pos: [0, 0, 0]     as [number, number, number], color: '#FF2D55', label: 'URGENT ×12'   },
    { pos: [-1, 0.5, 0]  as [number, number, number], color: '#FF9F0A', label: 'MODERATE ×28' },
    { pos: [1, 0.3, 0]   as [number, number, number], color: '#00FF88', label: 'LOW ×45'       },
    { pos: [0, -0.4, 0.8]as [number, number, number], color: '#00F5FF', label: 'PROCESSING'    },
    { pos: [-0.5, -0.5, -0.5] as [number, number, number], color: '#8B5CF6', label: 'AI RANK'  },
  ], []);

  const connections: [number, number][] = useMemo(() => [[0,1],[0,2],[0,3],[1,4],[2,4],[3,4]], []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    groupRef.current.position.y = 3 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, 3, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={RING_GEOMETRY_1}>
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={RING_GEOMETRY_2}>
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.15} />
      </mesh>

      {nodes.map((n, i) => (
        <HolographicNode key={i} position={n.pos} color={n.color} label={n.label} />
      ))}

      {connections.map(([a, b], i) => (
        <ConnectionLine key={i} start={nodes[a].pos} end={nodes[b].pos} color="#00F5FF" />
      ))}

      <pointLight color="#00F5FF" intensity={1} distance={5} />
    </group>
  );
}