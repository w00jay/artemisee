import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

export function Spacecraft() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const { simTime, trajectory } = useMissionStore.getState();
    if (trajectory.length < 2) return;

    const pos = hermiteInterpolate(trajectory, simTime);
    if (!pos) return;

    const v = j2000ToThreeJS(pos.x, pos.y, pos.z);
    meshRef.current.position.copy(v);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={0.5} />
    </mesh>
  );
}
