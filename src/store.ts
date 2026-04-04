import { create } from 'zustand';
import type { TrajectoryPoint, DsnDish, CameraPreset } from './data/types';

interface MissionStore {
  // Time
  simTime: number;
  playbackSpeed: number;
  isPlaying: boolean;

  // Camera
  cameraTarget: CameraPreset;

  // Data
  trajectory: TrajectoryPoint[];
  dsnDishes: DsnDish[];

  // Actions
  tick: (deltaSec: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setSimTime: (t: number) => void;
  jumpToNow: () => void;
  setCameraTarget: (target: CameraPreset) => void;
  setTrajectory: (points: TrajectoryPoint[]) => void;
  setDsnDishes: (dishes: DsnDish[]) => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  simTime: Date.now(),
  playbackSpeed: 1,
  isPlaying: true,

  cameraTarget: 'solar-system',

  trajectory: [],
  dsnDishes: [],

  tick: (deltaSec) =>
    set((state) => {
      if (!state.isPlaying) return state;
      return { simTime: state.simTime + deltaSec * 1000 * state.playbackSpeed };
    }),

  setPlaying: (playing) => set({ isPlaying: playing }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
  setSimTime: (t) => set({ simTime: t }),
  jumpToNow: () => set({ simTime: Date.now() }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setTrajectory: (points) => set({ trajectory: points }),
  setDsnDishes: (dishes) => set({ dsnDishes: dishes }),
}));
