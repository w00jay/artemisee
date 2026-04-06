import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

useTexture.preload('/textures/moon-4k.jpg');

const MOON_MAX = 3;       // exaggerated radius (far away)
const MOON_MIN = 0.273;   // true scale in Earth radii
const SHRINK_START = 12;   // start shrinking when spacecraft is this close (scene units)
const SHRINK_END = 2;      // fully shrunk at this distance

const _moonPos = new THREE.Vector3();
const _scPos = new THREE.Vector3();

export function Moon() {
  const meshRef = useRef<THREE.Group>(null!);
  const scaleRef = useRef(MOON_MAX);
  const texture = useTexture('/textures/moon-4k.jpg');

  useFrame(() => {
    const { simTime, trajectory } = useMissionStore.getState();
    const moon = GeoMoon(new Date(simTime));
    const pos = j2000ToThreeJS(
      moon.x * KM_PER_AU,
      moon.y * KM_PER_AU,
      moon.z * KM_PER_AU,
    );
    meshRef.current.position.copy(pos);
    _moonPos.copy(pos);

    // Shrink when spacecraft is close
    let targetScale = MOON_MAX;
    if (trajectory.length >= 2) {
      const sc = hermiteInterpolate(trajectory, simTime);
      if (sc) {
        _scPos.copy(j2000ToThreeJS(sc.x, sc.y, sc.z));
        const dist = _moonPos.distanceTo(_scPos);
        if (dist < SHRINK_START) {
          const t = Math.max(0, Math.min(1, (dist - SHRINK_END) / (SHRINK_START - SHRINK_END)));
          targetScale = MOON_MIN + t * (MOON_MAX - MOON_MIN);
        }
      }
    }

    // Smooth transition
    scaleRef.current += (targetScale - scaleRef.current) * 0.08;
    const s = scaleRef.current;
    meshRef.current.scale.setScalar(s / MOON_MAX);
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[MOON_MAX, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <Html position={[0, MOON_MAX + 3, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#cccccc', fontSize: 12, fontWeight: 600, textShadow: '0 0 4px #000' }}>
          Moon
        </span>
      </Html>
    </group>
  );
}
