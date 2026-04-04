import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SiderealTime } from 'astronomy-engine';
import { useMissionStore } from '../store';

export function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Use a placeholder color if texture isn't available yet
  let texture: THREE.Texture | null = null;
  try {
    texture = useTexture('/textures/earth-4k.jpg');
  } catch {
    // Texture not available; will use fallback color
  }

  useFrame(() => {
    const simTime = useMissionStore.getState().simTime;
    const gast = SiderealTime(new Date(simTime));
    meshRef.current.rotation.y = gast * (Math.PI / 12);
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        {texture ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#2244aa" />
        )}
      </mesh>
      <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#88bbff', fontSize: 12, fontWeight: 600, textShadow: '0 0 4px #000' }}>
          Earth
        </span>
      </Html>
    </group>
  );
}
