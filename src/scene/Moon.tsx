import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

useTexture.preload('/textures/moon-4k.jpg');

export function Moon() {
  const meshRef = useRef<THREE.Group>(null!);
  const texture = useTexture('/textures/moon-4k.jpg');

  useFrame(() => {
    const simTime = useMissionStore.getState().simTime;
    const moon = GeoMoon(new Date(simTime));
    const pos = j2000ToThreeJS(
      moon.x * KM_PER_AU,
      moon.y * KM_PER_AU,
      moon.z * KM_PER_AU,
    );
    meshRef.current.position.copy(pos);
  });

  // Exaggerated for visibility (true scale is 0.273 Earth radii).
  const moonScale = 4;

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[moonScale, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <Html position={[0, moonScale + 3, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#cccccc', fontSize: 12, fontWeight: 600, textShadow: '0 0 4px #000' }}>
          Moon
        </span>
      </Html>
    </group>
  );
}
