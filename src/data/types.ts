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

export interface DsnDish {
  name: string;
  station: string;
  target: string;
  upSignal: number;
  downSignal: number;
  range: number;
}

export type CameraPreset = 'solar-system' | 'earth' | 'moon' | 'spacecraft';
