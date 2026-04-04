import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SiderealTime } from 'astronomy-engine';
import { useMissionStore } from '../store';

// Preload texture so Suspense can handle the loading state
useTexture.preload('/textures/earth-4k.jpg');

export function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture('/textures/earth-4k.jpg');

  useFrame(() => {
    const simTime = useMissionStore.getState().simTime;
    const gast = SiderealTime(new Date(simTime));
    meshRef.current.rotation.y = gast * (Math.PI / 12);
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <Html position={[0, 4, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#88bbff', fontSize: 12, fontWeight: 600, textShadow: '0 0 4px #000' }}>
          Earth
        </span>
      </Html>
    </group>
  );
}
