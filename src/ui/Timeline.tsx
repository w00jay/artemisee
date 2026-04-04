import { useMemo } from 'react';
import { useMissionStore } from '../store';
import { MISSION_END, LAUNCH_DATE } from '../lib/constants';
import { Panel } from './Overlay';

const PHASES = [
  { name: 'Launch', start: 0, end: 0.04 },
  { name: 'Earth Orbit', start: 0.04, end: 0.12 },
  { name: 'TLI', start: 0.12, end: 0.14 },
  { name: 'Outbound', start: 0.14, end: 0.45 },
  { name: 'Lunar Flyby', start: 0.45, end: 0.55 },
  { name: 'Return', start: 0.55, end: 0.92 },
  { name: 'Entry & Splashdown', start: 0.92, end: 1.0 },
];

export function Timeline() {
  const simTime = useMissionStore((s) => s.simTime);
  const setSimTime = useMissionStore((s) => s.setSimTime);

  const progress = useMemo(() => {
    const total = MISSION_END.getTime() - LAUNCH_DATE.getTime();
    const elapsed = simTime - LAUNCH_DATE.getTime();
    return Math.max(0, Math.min(1, elapsed / total));
  }, [simTime]);

  const currentPhase = PHASES.find(
    (p) => progress >= p.start && progress < p.end,
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const total = MISSION_END.getTime() - LAUNCH_DATE.getTime();
    setSimTime(LAUNCH_DATE.getTime() + pct * total);
  };

  return (
    <Panel>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          {new Date(simTime).toUTCString().slice(0, 25)} UTC
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#00ccff' }}>
          {currentPhase?.name ?? '—'}
        </span>
      </div>

      <div
        onClick={handleClick}
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: '#00ccff',
            borderRadius: 3,
            transition: 'width 0.1s',
          }}
        />
      </div>
    </Panel>
  );
}
