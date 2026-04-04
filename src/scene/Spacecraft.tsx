import { useRef } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

export function Spacecraft() {
  const groupRef = useRef<THREE.Group>(null!);
  const spriteRef = useRef<THREE.Sprite>(null!);
  const { camera } = useThree();

  const texture = useLoader(THREE.TextureLoader, '/textures/orion-sprite.png');

  useFrame(() => {
    const { simTime, trajectory } = useMissionStore.getState();
    if (trajectory.length < 2) return;

    const pos = hermiteInterpolate(trajectory, simTime);
    if (!pos) return;

    const v = j2000ToThreeJS(pos.x, pos.y, pos.z);
    groupRef.current.position.copy(v);

    // Scale based on camera distance so it's always visible
    const dist = camera.position.distanceTo(groupRef.current.position);
    const scale = Math.max(0.4, dist * 0.018);
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <sprite ref={spriteRef}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
      {/* Glow halo behind sprite */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.1} />
      </mesh>
      <Html position={[0, 3, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#ffcc44', fontSize: 11, fontWeight: 600, textShadow: '0 0 4px #000', whiteSpace: 'nowrap' }}>
          Orion
        </span>
      </Html>
    </group>
  );
}
