import { useMemo } from 'react';
import { useMissionStore } from '../store';
import { MISSION_END, LAUNCH_DATE } from '../lib/constants';
import { Panel } from './Overlay';

const PHASES = [
  {
    name: 'Launch / Ascent',
    start: 0, end: 0.016,
    desc: 'SLS lifts off from LC-39B at Kennedy Space Center. Orion reaches orbit and deploys solar arrays.',
  },
  {
    name: 'ICPS Separation',
    start: 0.016, end: 0.023,
    desc: 'Orion separates from the Interim Cryogenic Propulsion Stage. The crew is now flying independently.',
  },
  {
    name: 'Earth Orbit Ops',
    start: 0.023, end: 0.060,
    desc: 'Orion performs systems checkouts in Earth orbit. CubeSats deploy from the upper stage.',
  },
  {
    name: 'Perigee Raise',
    start: 0.060, end: 0.117,
    desc: 'Engine burn raises the low point of orbit, setting up for the Trans-Lunar Injection.',
  },
  {
    name: 'Trans-Lunar Injection',
    start: 0.117, end: 0.118,
    desc: 'A 5-minute 55-second burn accelerates Orion to escape velocity, sending the crew toward the Moon.',
  },
  {
    name: 'Outbound Coast',
    start: 0.118, end: 0.472,
    desc: 'Orion coasts toward the Moon for ~3.5 days. The crew performs trajectory correction burns as needed.',
  },
  {
    name: 'Lunar Flyby',
    start: 0.472, end: 0.642,
    desc: 'Orion enters the lunar sphere of influence, reaches closest approach, then swings around the far side of the Moon using its gravity to return home.',
  },
  {
    name: 'Return Coast',
    start: 0.642, end: 0.980,
    desc: 'Orion heads back to Earth over ~3 days. The crew tests manual piloting and performs return correction burns.',
  },
  {
    name: 'Entry / Splashdown',
    start: 0.980, end: 1.0,
    desc: 'Orion separates from its service module, hits the atmosphere at 40,000 km/h, deploys parachutes, and splashes down in the Pacific off Baja California.',
  },
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

      {currentPhase?.desc && (
        <div style={{ fontSize: 11, color: 'rgba(228, 228, 231, 0.45)', lineHeight: 1.5, marginTop: 2 }}>
          {currentPhase.desc}
        </div>
      )}
    </Panel>
  );
}
