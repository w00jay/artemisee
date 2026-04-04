export const EARTH_RADIUS_KM = 6_371;
export const MOON_RADIUS_KM = 1_737.4;
export const SPEED_OF_LIGHT_KMS = 299_792.458;
export const LUNAR_DISTANCE_KM = 384_400;

export const ARTEMIS_II_ID = '-1024';
export const LAUNCH_DATE = new Date('2026-04-01T22:35:12Z');
export const MISSION_START = new Date('2026-04-02T02:00:00Z');
export const MISSION_END = new Date('2026-04-10T23:00:00Z');

export const HORIZONS_DEFAULTS = {
  format: 'json',
  COMMAND: `'${ARTEMIS_II_ID}'`,
  OBJ_DATA: "'NO'",
  MAKE_EPHEM: "'YES'",
  EPHEM_TYPE: "'VECTORS'",
  CENTER: "'500@399'",
  REF_PLANE: "'FRAME'",
  CSV_FORMAT: "'YES'",
  VEC_TABLE: "'2'",
  STEP_SIZE: "'30m'",
} as const;
