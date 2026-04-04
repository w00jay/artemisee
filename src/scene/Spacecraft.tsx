import { useRef } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';

const _posNow = new THREE.Vector3();
const _posAhead = new THREE.Vector3();
const _screenNow = new THREE.Vector3();
const _screenAhead = new THREE.Vector3();

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

    // Scale based on camera distance — bigger than before
    const dist = camera.position.distanceTo(groupRef.current.position);
    const scale = Math.max(0.6, dist * 0.028);
    groupRef.current.scale.setScalar(scale);

    // Rotate sprite so Orion's nose points along the trajectory
    const posAhead = hermiteInterpolate(trajectory, simTime + 60_000);
    if (posAhead && spriteRef.current) {
      _posNow.copy(v);
      const vAhead = j2000ToThreeJS(posAhead.x, posAhead.y, posAhead.z);
      _posAhead.copy(vAhead);

      // Project both positions to screen space
      _screenNow.copy(_posNow).project(camera);
      _screenAhead.copy(_posAhead).project(camera);

      // Angle on screen (sprite texture has nose pointing up = +Y)
      const dx = _screenAhead.x - _screenNow.x;
      const dy = _screenAhead.y - _screenNow.y;
      const angle = Math.atan2(dx, dy);
      spriteRef.current.material.rotation = -angle;
    }
  });

  return (
    <group ref={groupRef}>
      <sprite ref={spriteRef} scale={[2, 2, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
      {/* Glow halo behind sprite */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.08} />
      </mesh>
      <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#ffcc44', fontSize: 11, fontWeight: 600, textShadow: '0 0 4px #000', whiteSpace: 'nowrap' }}>
          Orion
        </span>
      </Html>
    </group>
  );
}
