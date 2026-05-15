'use client';
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const COMPLAINTS = [
  { id: 'p1', pos: [-2, 0, -1.5] as [number, number, number], type: 'pothole',     color: '#FF2D55', label: '🔴 Pothole',     priority: 'urgent'   },
  { id: 'p2', pos: [1.5, 0, -2]  as [number, number, number], type: 'garbage',     color: '#FF9F0A', label: '🟡 Garbage',     priority: 'moderate' },
  { id: 'p3', pos: [2, 0, 1]     as [number, number, number], type: 'drainage',    color: '#00F5FF', label: '🔵 Drainage',    priority: 'moderate' },
  { id: 'p4', pos: [-1, 0, 2]    as [number, number, number], type: 'electricity', color: '#FFD60A', label: '⚡ Power',        priority: 'low'      },
  { id: 'p5', pos: [0.5, 0, 0.5] as [number, number, number], type: 'pothole',     color: '#FF2D55', label: '🔴 Pothole',     priority: 'urgent'   },
  { id: 'p6', pos: [-2.5, 0, 1]  as [number, number, number], type: 'water',       color: '#00F5FF', label: '💧 Water leak',  priority: 'urgent'   },
];

const PIN_GEOMETRY = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
const HEAD_GEOMETRY = new THREE.SphereGeometry(0.1, 8, 8);
const RING_GEOMETRY = new THREE.RingGeometry(0.3, 0.35, 32);

const pulseVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const pulseFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float pulse = mod(uTime * 1.2, 2.0);
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float alpha = smoothstep(0.4, 0.1, abs(d - pulse * 0.4));
    gl_FragColor = vec4(uColor, alpha * (1.0 - pulse / 2.0));
  }
`;

function Pin({ complaint, visible }: { complaint: typeof COMPLAINTS[0]; visible: boolean }) {
  const pinRef = useRef<THREE.Group>(null!);
  const [hover, setHover] = useState(false);
  const pulseMaterialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    if (!pinRef.current) return;
    pinRef.current.position.y = visible
      ? THREE.MathUtils.lerp(pinRef.current.position.y, 0, 0.1)
      : THREE.MathUtils.lerp(pinRef.current.position.y, -2, 0.1);
    pinRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    
    if (pulseMaterialRef.current) {
      pulseMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={pinRef} position={[complaint.pos[0], -2, complaint.pos[2]]}>
      <mesh position={[0, 0.5, 0]} geometry={PIN_GEOMETRY}>
        <meshStandardMaterial color={complaint.color} emissive={complaint.color} emissiveIntensity={0.5} />
      </mesh>

      <mesh
        position={[0, 1.1, 0]}
        geometry={HEAD_GEOMETRY}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hover ? 1.2 : 1}
      >
        <meshStandardMaterial
          color={complaint.color}
          emissive={complaint.color}
          emissiveIntensity={hover ? 2 : 1}
        />
      </mesh>

      {hover && (
        <Html position={[0, 1.5, 0]} center>
          <div className="tag-cyan px-4 py-2 border rounded-lg whitespace-nowrap bg-black/80 font-bold" style={{ color: complaint.color, borderColor: complaint.color }}>
            {complaint.label}
          </div>
        </Html>
      )}

      {visible && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={RING_GEOMETRY}>
          <shaderMaterial
            ref={pulseMaterialRef}
            transparent
            depthWrite={false}
            vertexShader={pulseVertexShader}
            fragmentShader={pulseFragmentShader}
            uniforms={{
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(complaint.color) },
            }}
          />
        </mesh>
      )}
    </group>
  );
}

export function ComplaintPins({ visible = true }: { visible?: boolean }) {
  return (
    <group>
      {COMPLAINTS.map((c) => (
        <Pin key={c.id} complaint={c} visible={visible} />
      ))}
    </group>
  );
}