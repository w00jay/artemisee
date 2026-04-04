export const EARTH_RADIUS_KM = 6_371;
export const MOON_RADIUS_KM = 1_737.4;
export const KM_PER_AU = 149_597_870.691;

// Artemis II mission timeline (approximate)
// Ephemeris begins ~3.5h after launch (ICPS separation at 01:59:30 UTC)
export const MISSION_START = new Date('2026-04-02T02:00:00Z');
// Splashdown ~Apr 11 00:17 UTC; ephemeris may end slightly before
export const MISSION_END = new Date('2026-04-10T23:00:00Z');
// Launched April 1, 2026 at 22:35:12 UTC from LC-39B, Kennedy Space Center
export const LAUNCH_DATE = new Date('2026-04-01T22:35:12Z');

// Horizons spacecraft ID
export const ARTEMIS_II_ID = '-1024';

// Default Horizons query parameters
export const HORIZONS_DEFAULTS = {
  format: 'json',
  COMMAND: `'${ARTEMIS_II_ID}'`,
  OBJ_DATA: "'YES'",
  MAKE_EPHEM: "'YES'",
  EPHEM_TYPE: "'VECTORS'",
  CENTER: "'500@399'",
  REF_PLANE: "'FRAME'",
  CSV_FORMAT: "'YES'",
  VEC_TABLE: "'2'",
  STEP_SIZE: "'30m'",
} as const;
