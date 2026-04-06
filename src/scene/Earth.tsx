import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SiderealTime } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

// Preload texture so Suspense can handle the loading state
useTexture.preload('/textures/earth-4k.jpg');

const EARTH_MAX = 5;      // exaggerated radius
const EARTH_MIN = 1;      // true scale (1 Earth radius)
const SHRINK_START = 15;   // start shrinking when spacecraft is this close
const SHRINK_END = 3;      // fully shrunk at this distance

const _scPos = new THREE.Vector3();
const _earthPos = new THREE.Vector3(0, 0, 0);

export function Earth() {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const scaleRef = useRef(EARTH_MAX);
  const texture = useTexture('/textures/earth-4k.jpg');

  useFrame(() => {
    const { simTime, trajectory } = useMissionStore.getState();
    const gast = SiderealTime(new Date(simTime));
    meshRef.current.rotation.y = gast * (Math.PI / 12);

    // Shrink when spacecraft is close
    let targetScale = EARTH_MAX;
    if (trajectory.length >= 2) {
      const sc = hermiteInterpolate(trajectory, simTime);
      if (sc) {
        _scPos.copy(j2000ToThreeJS(sc.x, sc.y, sc.z));
        const dist = _earthPos.distanceTo(_scPos);
        if (dist < SHRINK_START) {
          const t = Math.max(0, Math.min(1, (dist - SHRINK_END) / (SHRINK_START - SHRINK_END)));
          targetScale = EARTH_MIN + t * (EARTH_MAX - EARTH_MIN);
        }
      }
    }

    scaleRef.current += (targetScale - scaleRef.current) * 0.08;
    groupRef.current.scale.setScalar(scaleRef.current / EARTH_MAX);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_MAX, 64, 64]} />
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
