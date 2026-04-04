import type { TrajectoryPoint } from './types';

function findBracket(points: TrajectoryPoint[], epoch: number): number {
  if (points.length < 2) return -1;
  if (epoch < points[0].epoch || epoch > points[points.length - 1].epoch) return -1;
  if (epoch === points[points.length - 1].epoch) return points.length - 2;

  let lo = 0;
  let hi = points.length - 2;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (epoch < points[mid].epoch) {
      hi = mid - 1;
    } else if (epoch >= points[mid + 1].epoch) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return lo;
}

export function hermiteInterpolate(
  points: TrajectoryPoint[],
  epoch: number,
): { x: number; y: number; z: number; vx: number; vy: number; vz: number } | null {
  const i = findBracket(points, epoch);
  if (i < 0) return null;

  const p0 = points[i];
  const p1 = points[i + 1];

  const dt = (p1.epoch - p0.epoch) / 1000;
  const t = (epoch - p0.epoch) / (p1.epoch - p0.epoch);
  const t2 = t * t;
  const t3 = t2 * t;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = (t3 - 2 * t2 + t) * dt;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = (t3 - t2) * dt;

  // Hermite derivative basis for velocity
  const dh00 = (6 * t2 - 6 * t) / ((p1.epoch - p0.epoch) / 1000);
  const dh10 = 3 * t2 - 4 * t + 1;
  const dh01 = (-6 * t2 + 6 * t) / ((p1.epoch - p0.epoch) / 1000);
  const dh11 = 3 * t2 - 2 * t;

  return {
    x: h00 * p0.x + h10 * p0.vx + h01 * p1.x + h11 * p1.vx,
    y: h00 * p0.y + h10 * p0.vy + h01 * p1.y + h11 * p1.vy,
    z: h00 * p0.z + h10 * p0.vz + h01 * p1.z + h11 * p1.vz,
    vx: dh00 * p0.x + dh10 * p0.vx + dh01 * p1.x + dh11 * p1.vx,
    vy: dh00 * p0.y + dh10 * p0.vy + dh01 * p1.y + dh11 * p1.vy,
    vz: dh00 * p0.z + dh10 * p0.vz + dh01 * p1.z + dh11 * p1.vz,
  };
}
