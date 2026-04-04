import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GeoVector, Body, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

const MARKER_DISTANCE = 150; // Earth radii — fixed distance for all markers
const UP = new THREE.Vector3(0, 1, 0);

const bodies = [
  { body: Body.Sun, label: 'Sun', color: '#ffee44', size: 3 },
  { body: Body.Venus, label: 'Venus', color: '#eeddaa', size: 1.2 },
  { body: Body.Mars, label: 'Mars', color: '#ff6644', size: 1.2 },
  { body: Body.Mercury, label: 'Mercury', color: '#bbaa99', size: 1 },
];

function Marker({ body, label, color, size }: typeof bodies[number]) {
  const groupRef = useRef<THREE.Group>(null!);
  const dir = useRef(new THREE.Vector3());

  useFrame(() => {
    const simTime = useMissionStore.getState().simTime;
    const geo = GeoVector(body, new Date(simTime), false);
    const pos = j2000ToThreeJS(
      geo.x * KM_PER_AU,
      geo.y * KM_PER_AU,
      geo.z * KM_PER_AU,
    );

    dir.current.copy(pos).normalize();
    groupRef.current.position.copy(dir.current).multiplyScalar(MARKER_DISTANCE);

    // Point the cone along the direction vector (away from Earth)
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.current);
    groupRef.current.quaternion.copy(quat);
  });

  const coneHeight = size * 12;
  const coneRadius = size * 1.2;

  return (
    <group ref={groupRef}>
      {/* Arrow cone pointing outward */}
      <mesh position={[0, coneHeight / 2, 0]}>
        <coneGeometry args={[coneRadius, coneHeight, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Thin tail shaft */}
      <mesh position={[0, -coneHeight * 0.6, 0]}>
        <cylinderGeometry args={[coneRadius * 0.2, coneRadius * 0.2, coneHeight, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <Html position={[0, coneHeight + 5, 0]} center style={{ pointerEvents: 'none' }}>
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
