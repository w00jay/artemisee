import { useMemo } from 'react';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { LAUNCH_DATE } from '../lib/constants';
import { Panel } from './Overlay';

function formatDistance(km: number): string {
  if (km < 1000) return `${km.toFixed(0)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

function formatMET(ms: number): string {
  if (ms < 0) return 'T-' + formatDuration(-ms);
  return 'T+' + formatDuration(ms);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m ${secs}s`;
}

export function MissionStats() {
  const simTime = useMissionStore((s) => s.simTime);
  const trajectory = useMissionStore((s) => s.trajectory);

  const stats = useMemo(() => {
    if (trajectory.length < 2) return null;

    const pos = hermiteInterpolate(trajectory, simTime);
    if (!pos) return null;

    // Distance from Earth (origin)
    const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

    // Distance from Moon
    const moon = GeoMoon(new Date(simTime));
    const moonKm = {
      x: moon.x * KM_PER_AU,
      y: moon.y * KM_PER_AU,
      z: moon.z * KM_PER_AU,
    };
    const distMoon = Math.sqrt(
      (pos.x - moonKm.x) ** 2 +
      (pos.y - moonKm.y) ** 2 +
      (pos.z - moonKm.z) ** 2,
    );

    // MET
    const met = simTime - LAUNCH_DATE.getTime();

    return { distEarth, distMoon, met };
  }, [simTime, trajectory]);

  if (!stats) return null;

  return (
    <Panel>
      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
        Artemis II — Orion "Integrity"
      </div>
      <div>Earth: {formatDistance(stats.distEarth)}</div>
      <div>Moon: {formatDistance(stats.distMoon)}</div>
      <div>MET: {formatMET(stats.met)}</div>
    </Panel>
  );
}
