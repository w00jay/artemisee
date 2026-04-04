import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';
import { MOON_RADIUS_KM, EARTH_RADIUS_KM } from '../lib/constants';

export function Moon() {
  const meshRef = useRef<THREE.Mesh>(null!);

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

  const moonScale = MOON_RADIUS_KM / EARTH_RADIUS_KM;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[moonScale, 32, 32]} />
      {texture ? (
        <meshStandardMaterial map={texture} />
      ) : (
        <meshStandardMaterial color="#aaaaaa" />
      )}
    </mesh>
  );
}
