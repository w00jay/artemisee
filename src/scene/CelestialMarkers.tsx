import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GeoVector, Body, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

const MARKER_DISTANCE = 150; // Earth radii — fixed distance for all markers

const bodies = [
  { body: Body.Sun, label: 'Sun', color: '#ffee44', size: 1.5 },
  { body: Body.Venus, label: 'Venus', color: '#eeddaa', size: 0.5 },
  { body: Body.Mars, label: 'Mars', color: '#ff6644', size: 0.5 },
  { body: Body.Mercury, label: 'Mercury', color: '#bbaa99', size: 0.4 },
];

function Marker({ body, label, color, size }: typeof bodies[number]) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const simTime = useMissionStore.getState().simTime;
    const geo = GeoVector(body, new Date(simTime), false);
    const pos = j2000ToThreeJS(
      geo.x * KM_PER_AU,
      geo.y * KM_PER_AU,
      geo.z * KM_PER_AU,
    );
    // Normalize to fixed distance
    pos.normalize().multiplyScalar(MARKER_DISTANCE);
    groupRef.current.position.copy(pos);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 2.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      <Html position={[0, size + 1, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{
          color,
          fontSize: 10,
          fontWeight: 600,
          textShadow: '0 0 4px #000, 0 0 8px #000',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </Html>
    </group>
  );
}

export function CelestialMarkers() {
  return (
    <group>
      {bodies.map((b) => (
        <Marker key={b.label} {...b} />
      ))}
    </group>
  );
}
