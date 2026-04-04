import type { MissionEvent } from './types';

export const MISSION_EVENTS: MissionEvent[] = [
  { name: 'Launch', met: '0/00:00', utc: '2026-04-01T22:35:12Z', epoch: 0, category: 'milestone' },
  { name: 'Solar arrays deploy', met: '0/00:20', utc: '2026-04-01T22:55:00Z', epoch: 0, category: 'milestone' },
  { name: 'Perigee raise maneuver', met: '0/00:50', utc: '2026-04-01T23:25:02Z', epoch: 0, category: 'burn' },
  { name: 'Apogee raise maneuver', met: '0/01:48', utc: '2026-04-02T00:23:09Z', epoch: 0, category: 'burn' },
  { name: 'Orion / ICPS separation', met: '0/03:24', utc: '2026-04-02T01:59:30Z', epoch: 0, category: 'milestone' },
  { name: 'CubeSats deploy', met: '0/05:04', utc: '2026-04-02T03:39:00Z', epoch: 0, category: 'milestone' },
  { name: 'Perigee raise burn', met: '0/12:55', utc: '2026-04-02T11:30:00Z', epoch: 0, category: 'burn' },
  { name: 'Trans-Lunar Injection burn', met: '1/01:14', utc: '2026-04-02T23:49:00Z', epoch: 0, category: 'burn' },
  { name: 'Earth shadow entrance', met: '1/01:35', utc: '2026-04-03T00:10:00Z', epoch: 0, category: 'milestone' },
  { name: 'Earth shadow exit', met: '1/02:41', utc: '2026-04-03T01:17:00Z', epoch: 0, category: 'milestone' },
  { name: 'Trajectory correction burn #2', met: '3/01:08', utc: '2026-04-04T23:43:00Z', epoch: 0, category: 'burn' },
  { name: 'Trajectory correction burn #3', met: '4/04:29', utc: '2026-04-06T03:04:00Z', epoch: 0, category: 'burn' },
  { name: 'Enter lunar sphere of influence', met: '4/06:08', utc: '2026-04-06T04:43:00Z', epoch: 0, category: 'milestone' },
  { name: 'Closest approach to Moon', met: '5/00:31', utc: '2026-04-06T23:06:00Z', epoch: 0, category: 'milestone' },
  { name: 'Maximum distance from Earth', met: '5/00:34', utc: '2026-04-06T23:09:00Z', epoch: 0, category: 'milestone' },
  { name: 'Exit lunar sphere of influence', met: '5/18:52', utc: '2026-04-07T17:27:00Z', epoch: 0, category: 'milestone' },
  { name: 'Return correction burn #1', met: '6/01:29', utc: '2026-04-08T00:04:00Z', epoch: 0, category: 'burn' },
  { name: 'Manual piloting demonstration', met: '7/04:20', utc: '2026-04-09T02:55:00Z', epoch: 0, category: 'science' },
  { name: 'Return correction burn #2', met: '8/04:29', utc: '2026-04-10T03:04:00Z', epoch: 0, category: 'burn' },
  { name: 'Return correction burn #3', met: '8/20:29', utc: '2026-04-10T19:04:00Z', epoch: 0, category: 'burn' },
  { name: 'CM / SM separation', met: '9/01:09', utc: '2026-04-10T23:44:00Z', epoch: 0, category: 'milestone' },
  { name: 'Entry interface (122 km)', met: '9/01:29', utc: '2026-04-11T00:04:00Z', epoch: 0, category: 'milestone' },
  { name: 'Splashdown', met: '9/01:42', utc: '2026-04-11T00:17:00Z', epoch: 0, category: 'milestone' },
];

// Pre-compute epochs
for (const event of MISSION_EVENTS) {
  event.epoch = new Date(event.utc).getTime();
}

const PHASES = [
  { name: 'Launch / Ascent', startUtc: '2026-04-01T22:35:12Z', endUtc: '2026-04-01T22:55:00Z' },
  { name: 'ICPS Separation', startUtc: '2026-04-01T22:55:00Z', endUtc: '2026-04-02T01:59:30Z' },
  { name: 'Earth Orbit Ops', startUtc: '2026-04-02T01:59:30Z', endUtc: '2026-04-02T11:30:00Z' },
  { name: 'Perigee Raise', startUtc: '2026-04-02T11:30:00Z', endUtc: '2026-04-02T23:49:00Z' },
  { name: 'Trans-Lunar Injection', startUtc: '2026-04-02T23:49:00Z', endUtc: '2026-04-02T23:54:00Z' },
  { name: 'Outbound Coast', startUtc: '2026-04-02T23:54:00Z', endUtc: '2026-04-06T04:43:00Z' },
  { name: 'Lunar Flyby', startUtc: '2026-04-06T04:43:00Z', endUtc: '2026-04-07T17:27:00Z' },
  { name: 'Return Coast', startUtc: '2026-04-07T17:27:00Z', endUtc: '2026-04-10T23:44:00Z' },
  { name: 'Entry / Splashdown', startUtc: '2026-04-10T23:44:00Z', endUtc: '2026-04-11T00:17:00Z' },
];

const parsedPhases = PHASES.map((p) => ({
  ...p,
  startEpoch: new Date(p.startUtc).getTime(),
  endEpoch: new Date(p.endUtc).getTime(),
}));

export function getMissionPhase(epoch: number): string {
  const phase = parsedPhases.find((p) => epoch >= p.startEpoch && epoch < p.endEpoch);
  return phase?.name ?? 'Unknown';
}

export function getEvents(
  filter: 'upcoming' | 'past' | 'all' | 'burns' | 'milestones',
  referenceEpoch: number,
  limit: number,
): Array<MissionEvent & { countdown_seconds: number; status: 'upcoming' | 'active' | 'completed' }> {
  let filtered = MISSION_EVENTS;

  if (filter === 'burns') {
    filtered = filtered.filter((e) => e.category === 'burn');
  } else if (filter === 'milestones') {
    filtered = filtered.filter((e) => e.category === 'milestone');
  }

  return filtered
    .map((e) => ({
      ...e,
      countdown_seconds: (e.epoch - referenceEpoch) / 1000,
      status: (e.epoch <= referenceEpoch ? 'completed' : 'upcoming') as 'upcoming' | 'active' | 'completed',
    }))
    .filter((e) => {
      if (filter === 'upcoming') return e.status === 'upcoming';
      if (filter === 'past') return e.status === 'completed';
      return true;
    })
    .slice(0, limit);
}
