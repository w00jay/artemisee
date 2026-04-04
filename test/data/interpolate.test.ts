import { describe, it, expect } from 'vitest';
import { hermiteInterpolate } from '../../src/data/interpolate';
import type { TrajectoryPoint } from '../../src/data/types';

function makePoint(epoch: number, x: number, vx: number): TrajectoryPoint {
  return { jd: 0, epoch, x, y: 0, z: 0, vx, vy: 0, vz: 0 };
}

describe('hermiteInterpolate', () => {
  const p0 = makePoint(0, 0, 10); // at t=0: x=0, vx=10 km/s
  const p1 = makePoint(10000, 100, 10); // at t=10s: x=100, vx=10 km/s
  const points = [p0, p1];

  it('returns start position at start epoch', () => {
    const result = hermiteInterpolate(points, 0);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(0, 5);
  });

  it('returns end position at end epoch', () => {
    const result = hermiteInterpolate(points, 10000);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(100, 5);
  });

  it('returns midpoint approximately at midpoint epoch', () => {
    const result = hermiteInterpolate(points, 5000);
    expect(result).not.toBeNull();
    // Linear motion at 10 km/s → x=50 at t=5s
    expect(result!.x).toBeCloseTo(50, 0);
  });

  it('returns null for epoch before range', () => {
    expect(hermiteInterpolate(points, -1)).toBeNull();
  });

  it('returns null for epoch after range', () => {
    expect(hermiteInterpolate(points, 10001)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(hermiteInterpolate([], 5000)).toBeNull();
  });

  it('handles multiple segments', () => {
    const multi = [
      makePoint(0, 0, 10),
      makePoint(10000, 100, 10),
      makePoint(20000, 200, 10),
    ];
    const result = hermiteInterpolate(multi, 15000);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(150, 0);
  });
});
