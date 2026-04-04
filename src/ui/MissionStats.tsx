import { useMemo } from 'react';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { useMissionStore } from '../store';
import { hermiteInterpolate } from '../data/interpolate';
import { LAUNCH_DATE } from '../lib/constants';
import { Panel } from './Overlay';

const LUNAR_DISTANCE_KM = 384_400;
const EARTH_RADIUS_KM = 6_371;

function formatDistance(km: number): string {
  if (km < 10_000) return `${km.toLocaleString('en', { maximumFractionDigits: 0 })} km`;
  return `${Math.round(km).toLocaleString('en')} km`;
}

function distanceContext(km: number, target: 'earth' | 'moon'): string {
  if (target === 'earth') {
    const ld = km / LUNAR_DISTANCE_KM;
    if (ld < 0.01) return `${(km / EARTH_RADIUS_KM).toFixed(1)} Earth radii`;
    return `${ld.toFixed(2)} LD`;
  }
  // moon distance
  if (km < 10_000) return 'approaching';
  const ld = km / LUNAR_DISTANCE_KM;
  return `${ld.toFixed(2)} LD`;
}

function formatMET(ms: number): string {
  if (ms < 0) return 'T\u2212' + formatDuration(-ms);
  return 'T+' + formatDuration(ms);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

const labelStyle: React.CSSProperties = {
  color: 'rgba(228, 228, 231, 0.5)',
  fontSize: 11,
  width: 42,
  display: 'inline-block',
};

const valueStyle: React.CSSProperties = {
  color: '#e4e4e7',
  fontVariantNumeric: 'tabular-nums',
};

export function MissionStats() {
  const simTime = useMissionStore((s) => s.simTime);
  const trajectory = useMissionStore((s) => s.trajectory);

  const stats = useMemo(() => {
    if (trajectory.length < 2) return null;

    const pos = hermiteInterpolate(trajectory, simTime);
    if (!pos) return null;

    const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

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

    const met = simTime - LAUNCH_DATE.getTime();

    return { distEarth, distMoon, met };
  }, [simTime, trajectory]);

  if (!stats) return null;

  const contextStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'rgba(228, 228, 231, 0.35)',
    marginLeft: 42,
    marginTop: -1,
  };

  return (
    <Panel>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#7dd3fc', letterSpacing: '0.02em' }}>
        Orion "Integrity"
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>
          <div><span style={labelStyle}>Earth</span> <span style={valueStyle}>{formatDistance(stats.distEarth)}</span></div>
          <div style={contextStyle}>{distanceContext(stats.distEarth, 'earth')}</div>
        </div>
        <div>
          <div><span style={labelStyle}>Moon</span> <span style={valueStyle}>{formatDistance(stats.distMoon)}</span></div>
          <div style={contextStyle}>{distanceContext(stats.distMoon, 'moon')}</div>
        </div>
        <div><span style={labelStyle}>MET</span> <span style={valueStyle}>{formatMET(stats.met)}</span></div>
      </div>
    </Panel>
  );
}
