import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

export function Moon() {
  const meshRef = useRef<THREE.Group>(null!);

  let texture: THREE.Texture | null = null;
  try {
    texture = useTexture('/textures/moon-4k.jpg');
  } catch {
    // Fallback color
  }

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

  // True scale is 0.273 Earth radii — too small at overview zoom.
  // Exaggerate to ~1 Earth radius for visibility.
  const moonScale = 1;

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[moonScale, 32, 32]} />
        {texture ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#aaaaaa" />
        )}
      </mesh>
      <Html position={[0, moonScale + 3, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#cccccc', fontSize: 12, fontWeight: 600, textShadow: '0 0 4px #000' }}>
          Moon
        </span>
      </Html>
    </group>
  );
}
