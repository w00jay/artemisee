import type { TrajectoryPoint } from './types';

function jdToEpoch(jd: number): number {
  return (jd - 2440587.5) * 86400000;
}

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
