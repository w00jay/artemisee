import type { TrajectoryPoint } from './types';
import { horizonsParams, MISSION_START, MISSION_END } from '../lib/constants';
import type { MissionDef } from '../lib/missions';

/**
 * Convert Julian Date to Unix milliseconds.
 * JD 2440587.5 = Unix epoch (1970-01-01T00:00:00Z)
 */
function jdToEpoch(jd: number): number {
  return (jd - 2440587.5) * 86400000;
}

/**
 * Parse Horizons VECTORS response (CSV_FORMAT='YES', VEC_TABLE='2').
 *
 * Each data row contains:
 *   JDTDB, Calendar Date (TDB), X, Y, Z, VX, VY, VZ,
 */
export function parseHorizonsVectors(json: { result: string }): TrajectoryPoint[] {
  const soe = json.result.indexOf('$$SOE');
  const eoe = json.result.indexOf('$$EOE');
  if (soe === -1 || eoe === -1) {
    throw new Error('Missing $$SOE/$$EOE markers in Horizons response');
  }

  const block = json.result.slice(soe + 5, eoe).trim();
  const lines = block.split('\n').filter((l) => l.trim().length > 0);

  const points: TrajectoryPoint[] = [];

  for (const line of lines) {
    const fields = line.split(',').map((f) => f.trim());
    // VEC_TABLE='2' CSV: JDTDB, Cal, X, Y, Z, VX, VY, VZ
    if (fields.length < 8) continue;

    const jd = parseFloat(fields[0]);
    if (isNaN(jd)) continue;

    points.push({
      jd,
      epoch: jdToEpoch(jd),
      x: parseFloat(fields[2]),
      y: parseFloat(fields[3]),
      z: parseFloat(fields[4]),
      vx: parseFloat(fields[5]),
      vy: parseFloat(fields[6]),
      vz: parseFloat(fields[7]),
    });
  }

  return points;
}

/**
 * Fetch trajectory from our API proxy.
 * Accepts an optional mission def to query any Artemis mission.
 */
export async function fetchTrajectory(mission?: MissionDef): Promise<TrajectoryPoint[]> {
  const start = mission?.missionStart ?? MISSION_START;
  const end = mission?.missionEnd ?? MISSION_END;
  const hId = mission?.horizonsId ?? '-1024';

  const params = new URLSearchParams({
    ...horizonsParams(hId),
    START_TIME: `'${start.toISOString().slice(0, 19)}'`,
    STOP_TIME: `'${end.toISOString().slice(0, 19)}'`,
  });

  const res = await fetch(`/api/horizons?${params}`);
  if (!res.ok) throw new Error(`Horizons proxy error: ${res.status}`);

  const json = await res.json();
  if (json.error) throw new Error(`Horizons API error: ${json.error}`);

  return parseHorizonsVectors(json);
}
