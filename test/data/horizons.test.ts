import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHorizonsVectors } from '../../src/data/horizons';

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/horizons-sample.json'), 'utf-8'),
);

describe('parseHorizonsVectors', () => {
  it('parses all data points from fixture', () => {
    const points = parseHorizonsVectors(fixture);
    expect(points).toHaveLength(5);
  });

  it('extracts correct Julian date for first point', () => {
    const points = parseHorizonsVectors(fixture);
    expect(points[0].jd).toBeCloseTo(2461133.5, 1);
  });

  it('extracts correct position for first point (km)', () => {
    const points = parseHorizonsVectors(fixture);
    expect(points[0].x).toBeCloseTo(-4167.61, 0);
    expect(points[0].y).toBeCloseTo(5707.47, 0);
    expect(points[0].z).toBeCloseTo(2994.83, 0);
  });

  it('extracts correct velocity for first point (km/s)', () => {
    const points = parseHorizonsVectors(fixture);
    expect(points[0].vx).toBeCloseTo(-9.9269, 2);
    expect(points[0].vy).toBeCloseTo(-1.5812, 2);
    expect(points[0].vz).toBeCloseTo(-1.0513, 2);
  });

  it('computes epoch as Unix ms from Julian date', () => {
    const points = parseHorizonsVectors(fixture);
    const expectedDate = new Date('2026-04-03T00:00:00Z');
    // Allow 1 second tolerance for JD→epoch conversion
    expect(Math.abs(points[0].epoch - expectedDate.getTime())).toBeLessThan(1000);
  });

  it('points are in chronological order', () => {
    const points = parseHorizonsVectors(fixture);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].epoch).toBeGreaterThan(points[i - 1].epoch);
    }
  });

  it('throws on missing $$SOE/$$EOE markers', () => {
    expect(() => parseHorizonsVectors({ result: 'no markers here' })).toThrow(
      /Missing \$\$SOE\/\$\$EOE/,
    );
  });
});
