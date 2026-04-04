import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { j2000ToThreeJS } from '../data/coordinates';

const LUNAR_PERIOD_MS = 27.3 * 24 * 60 * 60 * 1000; // sidereal month
const ORBIT_STEPS = 120;

// Ecliptic is tilted ~23.44° from equatorial (J2000).
// In our Three.js coords (Y=ECI-Z, Z=-ECI-Y), the ecliptic
// normal in ECI is (0, -sin(23.44°), cos(23.44°)).
// Ecliptic ring lies in a plane tilted 23.44° from XZ in Three.js.
const ECLIPTIC_TILT = 23.44 * (Math.PI / 180);

function useMoonOrbit(): [number, number, number][] | null {
  const simTime = useMissionStore((s) => s.simTime);

  return useMemo(() => {
    const points: [number, number, number][] = [];
    const startTime = simTime - LUNAR_PERIOD_MS / 2;

    for (let i = 0; i <= ORBIT_STEPS; i++) {
      const t = startTime + (i / ORBIT_STEPS) * LUNAR_PERIOD_MS;
      const moon = GeoMoon(new Date(t));
      const pos = j2000ToThreeJS(
        moon.x * KM_PER_AU,
        moon.y * KM_PER_AU,
        moon.z * KM_PER_AU,
      );
      points.push([pos.x, pos.y, pos.z]);
    }

    return points;
    // Recompute only when simTime changes by >1 hour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(simTime / 3_600_000)]);
}

function MoonOrbit() {
  const points = useMoonOrbit();
  if (!points) return null;

  return (
    <Line
      points={points}
      color="#8888aa"
      lineWidth={2}
      transparent
      opacity={0.55}
      dashed
      dashSize={1}
      gapSize={0.5}
    />
  );
}

function EclipticRing() {
  const RADIUS = 80; // Earth radii — visual reference size
  const SEGMENTS = 128;

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(angle) * RADIUS;
      // Tilt the ring by ecliptic obliquity
      const y = Math.sin(angle) * RADIUS * Math.sin(ECLIPTIC_TILT);
      const z = Math.sin(angle) * RADIUS * Math.cos(ECLIPTIC_TILT);
      pts.push([x, y, -z]);
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#ffee44"
      lineWidth={1}
      transparent
      opacity={0.12}
      dashed
      dashSize={2}
      gapSize={1.5}
    />
  );
}

export function Orbits() {
  return (
    <group>
      <MoonOrbit />
      <EclipticRing />
    </group>
  );
}
