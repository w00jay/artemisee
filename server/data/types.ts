export interface TrajectoryPoint {
  jd: number;
  epoch: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface MissionEvent {
  name: string;
  met: string;
  utc: string;
  epoch: number;
  category: 'milestone' | 'burn' | 'maneuver' | 'science';
}

export interface PositionResult {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  distance_earth_km: number;
  distance_moon_km: number;
  velocity_kms: number;
  light_time_seconds: number;
  timestamp_utc: string;
  mission_phase: string;
}

export interface DsnContact {
  antenna: string;
  station: string;
  target: string;
  uplink_freq_mhz: number;
  downlink_freq_mhz: number;
  range_km: number;
}
