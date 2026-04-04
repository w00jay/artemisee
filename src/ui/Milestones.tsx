import { useMemo } from 'react';
import { useMissionStore } from '../store';
import { Panel } from './Overlay';

const EVENTS = [
  { met: '0/00:00',    time: '2026-04-01T22:35:12Z', label: 'Launch' },
  { met: '0/00:20',    time: '2026-04-01T22:55:00Z', label: 'Solar arrays deploy' },
  { met: '0/00:50',    time: '2026-04-01T23:25:02Z', label: 'Perigee raise maneuver' },
  { met: '0/01:48',    time: '2026-04-02T00:23:09Z', label: 'Apogee raise maneuver' },
  { met: '0/03:24',    time: '2026-04-02T01:59:30Z', label: 'Orion / ICPS separation' },
  { met: '0/05:04',    time: '2026-04-02T03:39:00Z', label: 'CubeSats deploy' },
  { met: '0/12:55',    time: '2026-04-02T11:30:00Z', label: 'Perigee raise burn' },
  { met: '1/01:14',    time: '2026-04-02T23:49:00Z', label: 'Trans-Lunar Injection burn' },
  { met: '1/01:35',    time: '2026-04-03T00:10:00Z', label: 'Earth shadow entrance' },
  { met: '1/02:41',    time: '2026-04-03T01:17:00Z', label: 'Earth shadow exit' },
  { met: '3/01:08',    time: '2026-04-04T23:43:00Z', label: 'Trajectory correction burn #2' },
  { met: '4/04:29',    time: '2026-04-06T03:04:00Z', label: 'Trajectory correction burn #3' },
  { met: '4/06:08',    time: '2026-04-06T04:43:00Z', label: 'Enter lunar sphere of influence' },
  { met: '5/00:31',    time: '2026-04-06T23:06:00Z', label: 'Closest approach to Moon' },
  { met: '5/00:34',    time: '2026-04-06T23:09:00Z', label: 'Maximum distance from Earth' },
  { met: '5/18:52',    time: '2026-04-07T17:27:00Z', label: 'Exit lunar sphere of influence' },
  { met: '6/01:29',    time: '2026-04-08T00:04:00Z', label: 'Return correction burn #1' },
  { met: '7/04:20',    time: '2026-04-09T02:55:00Z', label: 'Manual piloting demonstration' },
  { met: '8/04:29',    time: '2026-04-10T03:04:00Z', label: 'Return correction burn #2' },
  { met: '8/20:29',    time: '2026-04-10T19:04:00Z', label: 'Return correction burn #3' },
  { met: '9/01:09',    time: '2026-04-10T23:44:00Z', label: 'CM / SM separation' },
  { met: '9/01:29',    time: '2026-04-11T00:04:00Z', label: 'Entry interface (122 km)' },
  { met: '9/01:42',    time: '2026-04-11T00:17:00Z', label: 'Splashdown' },
];

const parsedEvents = EVENTS.map((e) => ({
  ...e,
  epoch: new Date(e.time).getTime(),
}));

export function Milestones() {
  const simTime = useMissionStore((s) => s.simTime);

  const { prevEvents, nextEvents, currentIdx } = useMemo(() => {
    let idx = parsedEvents.findIndex((e) => e.epoch > simTime);
    if (idx === -1) idx = parsedEvents.length;

    return {
      prevEvents: parsedEvents.slice(Math.max(0, idx - 2), idx),
      nextEvents: parsedEvents.slice(idx, idx + 3),
      currentIdx: idx,
    };
  }, [simTime]);

  const setSimTime = useMissionStore((s) => s.setSimTime);

  const formatCountdown = (ms: number): string => {
    const abMs = Math.abs(ms);
    const sec = Math.floor(abMs / 1000) % 60;
    const min = Math.floor(abMs / 60000) % 60;
    const hr = Math.floor(abMs / 3600000) % 24;
    const day = Math.floor(abMs / 86400000);
    const sign = ms < 0 ? '-' : '+';
    if (day > 0) return `${sign}${day}d ${hr}h`;
    if (hr > 0) return `${sign}${hr}h ${min}m`;
    return `${sign}${min}m ${sec}s`;
  };

  return (
    <Panel style={{ maxWidth: 260, maxHeight: 200, overflowY: 'auto' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12, color: '#7dd3fc', letterSpacing: '0.02em' }}>
        Mission Events
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {prevEvents.map((e) => (
          <div
            key={e.met}
            onClick={() => setSimTime(e.epoch)}
            style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, cursor: 'pointer', opacity: 0.4 }}
          >
            <span style={{ color: '#e4e4e7' }}>{e.label}</span>
            <span style={{ color: 'rgba(228, 228, 231, 0.4)', fontVariantNumeric: 'tabular-nums', marginLeft: 8, whiteSpace: 'nowrap' }}>
              {formatCountdown(e.epoch - simTime)}
            </span>
          </div>
        ))}

        {nextEvents.length > 0 && (
          <div
            style={{
              borderTop: '1px solid rgba(125, 211, 252, 0.2)',
              borderBottom: '1px solid rgba(125, 211, 252, 0.2)',
              padding: '3px 0',
              margin: '2px 0',
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(125, 211, 252, 0.6)', marginBottom: 2, letterSpacing: '0.05em' }}>
              UPCOMING
            </div>
            {nextEvents.map((e, i) => (
              <div
                key={e.met}
                onClick={() => setSimTime(e.epoch)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  cursor: 'pointer',
                  opacity: i === 0 ? 1 : 0.6,
                }}
              >
                <span style={{ color: i === 0 ? '#7dd3fc' : '#e4e4e7' }}>{e.label}</span>
                <span style={{
                  color: i === 0 ? '#7dd3fc' : 'rgba(228, 228, 231, 0.4)',
                  fontVariantNumeric: 'tabular-nums',
                  marginLeft: 8,
                  whiteSpace: 'nowrap',
                }}>
                  {formatCountdown(e.epoch - simTime)}
                </span>
              </div>
            ))}
          </div>
        )}

        {currentIdx >= parsedEvents.length && (
          <div style={{ fontSize: 11, color: '#fbbf24', textAlign: 'center', padding: 4 }}>
            Mission complete
          </div>
        )}
      </div>
    </Panel>
  );
}
