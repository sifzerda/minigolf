// src/store/useGameStore.js

import { create } from "zustand";

const useGameStore = create((set) => ({
  strokes: 0,
  power: 0.5,
  aimAngle: 0,
  cameraDistance: 8,
  charging: false,
  completed: false,

  setPower: (power) => set({ power: Math.max(0.1, Math.min(1, power)) }),
  setAimAngle: (aimAngle) => set({ aimAngle }),

  setCameraDistance: (distance) =>
    set({
      cameraDistance: Math.max(4, Math.min(15, distance)),
    }),

  setCharging: (charging) => set({ charging }),

  recordStroke: () =>
    set((state) => ({
      strokes: state.strokes + 1,
    })),

  completeHole: () => set({ completed: true }),

  resetGame: () =>
    set({
      strokes: 0,
      power: 0.5,
      aimAngle: 0,
      cameraDistance: 8,
      charging: false,
      completed: false,
    }),
}));

export default useGameStore;