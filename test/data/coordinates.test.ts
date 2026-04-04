import { describe, it, expect } from 'vitest';
import { j2000ToThreeJS } from '../../src/data/coordinates';
import { EARTH_RADIUS_KM } from '../../src/lib/constants';

describe('j2000ToThreeJS', () => {
  it('maps ECI X to Three.js X', () => {
    const v = j2000ToThreeJS(EARTH_RADIUS_KM, 0, 0);
    expect(v.x).toBeCloseTo(1, 5);
    expect(v.y).toBeCloseTo(0, 5);
    expect(v.z).toBeCloseTo(0, 5);
  });

  it('maps ECI Y to negative Three.js Z', () => {
    const v = j2000ToThreeJS(0, EARTH_RADIUS_KM, 0);
    expect(v.x).toBeCloseTo(0, 5);
    expect(v.y).toBeCloseTo(0, 5);
    expect(v.z).toBeCloseTo(-1, 5);
  });

  it('maps ECI Z to Three.js Y', () => {
    const v = j2000ToThreeJS(0, 0, EARTH_RADIUS_KM);
    expect(v.x).toBeCloseTo(0, 5);
    expect(v.y).toBeCloseTo(1, 5);
    expect(v.z).toBeCloseTo(0, 5);
  });

  it('scales by Earth radius so 1 unit = 1 Earth radius', () => {
    const v = j2000ToThreeJS(EARTH_RADIUS_KM * 60, 0, 0);
    expect(v.x).toBeCloseTo(60, 3);
  });

  it('accepts custom scale', () => {
    const v = j2000ToThreeJS(100, 0, 0, 0.01);
    expect(v.x).toBeCloseTo(1, 5);
  });
});
