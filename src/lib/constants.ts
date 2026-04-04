export const EARTH_RADIUS_KM = 6_371;
export const MOON_RADIUS_KM = 1_737.4;
export const KM_PER_AU = 149_597_870.691;

// Artemis II mission timeline (approximate)
export const MISSION_START = new Date('2026-04-02T00:00:00Z');
export const MISSION_END = new Date('2026-04-12T00:00:00Z');
export const LAUNCH_DATE = new Date('2026-04-01T00:00:00Z');

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
