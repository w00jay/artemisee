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
  { name: 'Entry / Splashdown', start: 0.92, end: 1.0 },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'rgba(228, 228, 231, 0.5)', fontVariantNumeric: 'tabular-nums' }}>
          {new Date(simTime).toISOString().replace('T', ' ').slice(0, 19)} UTC
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#7dd3fc' }}>
          {currentPhase?.name ?? '\u2014'}
        </span>
      </div>

      {/* Clickable track — padded for easier targeting */}
      <div
        onClick={handleClick}
        style={{
          padding: '6px 0',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            height: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0ea5e9, #7dd3fc)',
              borderRadius: 2,
            }}
          />
        </div>
        {/* Playhead dot */}
        <div
          style={{
            position: 'relative',
            top: -7,
            left: `${progress * 100}%`,
            width: 10,
            height: 10,
            marginLeft: -5,
            borderRadius: '50%',
            background: '#7dd3fc',
            border: '2px solid rgba(10, 10, 14, 0.8)',
            boxShadow: '0 0 6px rgba(125, 211, 252, 0.4)',
            transition: 'left 0.1s',
          }}
        />
      </div>
    </Panel>
  );
}
