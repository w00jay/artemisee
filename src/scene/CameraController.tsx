import { useRef, useEffect } from 'react';
import { CameraControls } from '@react-three/drei';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { j2000ToThreeJS } from '../data/coordinates';
import type { CameraPreset } from '../data/types';

const PRESETS: Record<CameraPreset, { offset: [number, number, number] }> = {
  'solar-system': { offset: [0, 200, 200] },
  earth: { offset: [0, 3, 3] },
  moon: { offset: [2, 1, 2] },
  spacecraft: { offset: [0.5, 0.3, 0.5] },
};

export function CameraController() {
  const controlsRef = useRef<CameraControls>(null!);
  const cameraTarget = useMissionStore((s) => s.cameraTarget);

  useEffect(() => {
    if (!controlsRef.current) return;

    const { simTime, trajectory } = useMissionStore.getState();
    const preset = PRESETS[cameraTarget];

    let targetPos = { x: 0, y: 0, z: 0 };

    if (cameraTarget === 'moon') {
      const moon = GeoMoon(new Date(simTime));
      const v = j2000ToThreeJS(
        moon.x * KM_PER_AU,
        moon.y * KM_PER_AU,
        moon.z * KM_PER_AU,
      );
      targetPos = { x: v.x, y: v.y, z: v.z };
    } else if (cameraTarget === 'spacecraft' && trajectory.length >= 2) {
      const interp = hermiteInterpolate(trajectory, simTime);
      if (interp) {
        const v = j2000ToThreeJS(interp.x, interp.y, interp.z);
        targetPos = { x: v.x, y: v.y, z: v.z };
      }
    }

    controlsRef.current.setLookAt(
      targetPos.x + preset.offset[0],
      targetPos.y + preset.offset[1],
      targetPos.z + preset.offset[2],
      targetPos.x,
      targetPos.y,
      targetPos.z,
      true, // smooth transition
    );
  }, [cameraTarget]);

  return (
    <CameraControls
      ref={controlsRef}
      smoothTime={0.5}
      minDistance={0.5}
      maxDistance={1000}
    />
  );
}
