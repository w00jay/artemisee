import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Suspense } from 'react';
import { Earth } from './Earth';
import { Moon } from './Moon';
import { Spacecraft } from './Spacecraft';
import { Trajectory } from './Trajectory';
import { CameraController } from './CameraController';
import { useMissionStore } from '../store';

function ClockTick() {
  const tick = useMissionStore((s) => s.tick);
  useFrame((_, delta) => tick(delta));
  return null;
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 200, 200], near: 0.01, far: 10000 }}
      style={{ background: '#000' }}
    >
      <ClockTick />
      <ambientLight intensity={0.15} />
      <directionalLight position={[100, 50, 50]} intensity={1.5} />
      <Stars radius={500} depth={100} count={5000} factor={4} fade speed={0.5} />

      <Suspense fallback={null}>
        <Earth />
        <Moon />
        <Trajectory />
        <Spacecraft />
      </Suspense>

      <CameraController />
    </Canvas>
  );
}
