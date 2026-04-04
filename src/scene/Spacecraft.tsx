import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

export function Spacecraft() {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  useFrame(() => {
    const { simTime, trajectory } = useMissionStore.getState();
    if (trajectory.length < 2) return;

    const pos = hermiteInterpolate(trajectory, simTime);
    if (!pos) return;

    const v = j2000ToThreeJS(pos.x, pos.y, pos.z);
    groupRef.current.position.copy(v);

    // Scale based on camera distance so it's always visible
    const dist = camera.position.distanceTo(groupRef.current.position);
    const scale = Math.max(0.3, dist * 0.012);
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={0.8} />
      </mesh>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
