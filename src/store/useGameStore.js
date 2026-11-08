import { create } from "zustand";
import { persist } from "zustand/middleware";
import { courses } from "../courses";

export const CLUB_COLORS = {
  orange: "#f36b4e", black: "#222222", yellow: "#f4d900",
  blue: "#344dc6", red: "#e32636", green: "#17a34a",
};

const initialGame = {
  courseIndex: 0, sessionId: 0, strokes: 0, results: [],
  completed: false, gameComplete: false, power: 0.5, aimAngle: 0,
  topSpin: 0, sideSpin: 0, chargeMode: "normal",
  cameraDistance: 8, cameraMode: "follow", charging: false,
};

const useGameStore = create(persist((set, get) => ({
  ...initialGame,
  bestScores: {},
  clubColor: "blue",
  shotRequest: null,
  setClubColor: (color) => set({ clubColor: CLUB_COLORS[color] ? color : "blue" }),
  requestShot: (power, angle, jump = false) => {
    const state = get();
    if (state.completed || state.gameComplete || state.shotRequest) return false;
    set({ shotRequest: { id: (state.shotSequence ?? 0) + 1,
      power: Math.max(0.1, Math.min(1, power)), angle, jump },
      shotSequence: (state.shotSequence ?? 0) + 1, charging: false });
    return true;
  },
  clearShotRequest: (id) => set((s) => s.shotRequest?.id === id ? { shotRequest: null } : {}),
  setPower: (power) => set({ power: Math.max(0.1, Math.min(1, power)) }),
  setAimAngle: (aimAngle) => set({ aimAngle }),
  setTopSpin: (value) => set({ topSpin: Math.max(-1, Math.min(1, value)) }),
  setSideSpin: (value) => set({ sideSpin: Math.max(-1, Math.min(1, value)) }),
  resetSpin: () => set({ topSpin: 0, sideSpin: 0 }),
  setChargeMode: (mode) => set({ chargeMode: mode === "jump" ? "jump" : "normal" }),
  setCameraDistance: (distance) => set({ cameraDistance: Math.max(4, Math.min(15, distance)) }),
  setCameraMode: (mode) => set({ cameraMode: mode === "overview" ? "overview" : "follow" }),
  toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === "follow" ? "overview" : "follow" })),
  setCharging: (charging) => set({ charging }),
  recordStroke: () => set((s) => s.completed || s.gameComplete ? s : { strokes: s.strokes + 1 }),
  isCourseUnlocked: (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= courses.length) return false;
    return index === 0 || get().bestScores[courses[index - 1].id] !== undefined;
  },
  completeHole: () => set((s) => {
    if (s.completed || s.gameComplete) return s;
    const course = courses[s.courseIndex];
    if (!course) return s;
    const old = s.bestScores[course.id];
    const best = old === undefined ? s.strokes : Math.min(old, s.strokes);
    return { completed: true, charging: false, shotRequest: null,
      results: [...s.results.filter((r) => r.courseId !== course.id),
        { courseId: course.id, name: course.name, par: course.par, strokes: s.strokes }],
      bestScores: { ...s.bestScores, [course.id]: best } };
  }),
  nextCourse: () => set((s) => {
    if (!s.completed) return s;
    const nextIndex = s.courseIndex + 1;
    if (nextIndex >= courses.length) return { gameComplete: true, charging: false, shotRequest: null };
    return { courseIndex: nextIndex, sessionId: s.sessionId + 1, strokes: 0,
      completed: false, gameComplete: false, charging: false, shotRequest: null,
      power: 0.5, aimAngle: 0, cameraMode: "follow" };
  }),
  selectCourse: (index) => {
    if (!get().isCourseUnlocked(index)) return false;
    set((s) => ({ courseIndex: index, sessionId: s.sessionId + 1, strokes: 0,
      results: [], completed: false, gameComplete: false, charging: false,
      shotRequest: null, power: 0.5, aimAngle: 0, cameraMode: "follow" }));
    return true;
  },
  restartCourse: () => set((s) => {
    const course = courses[s.courseIndex];
    return { sessionId: s.sessionId + 1, strokes: 0, completed: false,
      gameComplete: false, charging: false, shotRequest: null, power: 0.5,
      aimAngle: 0, cameraMode: "follow",
      results: s.results.filter((r) => r.courseId !== course?.id) };
  }),
  resetGame: () => set((s) => ({ ...initialGame, sessionId: s.sessionId + 1,
    results: [], shotRequest: null })),
  clearProgress: () => set((s) => ({ ...initialGame, sessionId: s.sessionId + 1,
    results: [], bestScores: {}, shotRequest: null })),
}), { name: "mini-golf-progress", partialize: (s) => ({ bestScores: s.bestScores, clubColor: s.clubColor }) }));
export default useGameStore;
