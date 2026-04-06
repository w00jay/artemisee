export interface MissionDef {
  id: string;
  name: string;
  spacecraft: string;
  horizonsId: string;
  launchDate: Date;
  missionStart: Date;
  missionEnd: Date;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
}

export const MISSIONS: Record<string, MissionDef> = {
  'artemis-ii': {
    id: 'artemis-ii',
    name: 'Artemis II',
    spacecraft: 'Orion "Integrity"',
    horizonsId: '-1024',
    launchDate: new Date('2026-04-01T22:35:12Z'),
    missionStart: new Date('2026-04-02T02:00:00Z'),
    missionEnd: new Date('2026-04-10T23:00:00Z'),
    description: 'First crewed lunar flyby since Apollo 17',
    status: 'active',
  },
  'artemis-i': {
    id: 'artemis-i',
    name: 'Artemis I',
    spacecraft: 'Orion "Moonikin"',
    horizonsId: '-1023',
    launchDate: new Date('2022-11-16T06:47:44Z'),
    missionStart: new Date('2022-11-16T08:00:00Z'),
    missionEnd: new Date('2022-12-11T17:40:00Z'),
    description: 'Uncrewed lunar orbit test flight',
    status: 'completed',
  },
};

export const DEFAULT_MISSION = 'artemis-ii';

export function getMission(id: string): MissionDef {
  return MISSIONS[id] ?? MISSIONS[DEFAULT_MISSION];
}
