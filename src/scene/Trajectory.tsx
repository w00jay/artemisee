import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

export function Trajectory() {
  const trajectory = useMissionStore((s) => s.trajectory);

  const points = useMemo(() => {
    if (trajectory.length === 0) return null;
    return trajectory.map((p) => {
      const v = j2000ToThreeJS(p.x, p.y, p.z);
      return [v.x, v.y, v.z] as [number, number, number];
    });
  }, [trajectory]);

  if (!points || points.length < 2) return null;

  return <Line points={points} color="#00ccff" lineWidth={1.5} />;
}
