// src/store/useGameStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { courses } from "../courses";

const initialGame = {
  courseIndex: 0,
  sessionId: 0,
  strokes: 0,
  results: [],
  completed: false,
  gameComplete: false,
  power: 0.5,
  aimAngle: 0,
  topSpin: 0,
  sideSpin: 0,
  chargeMode: "normal",
  cameraDistance: 8,
  cameraMode: "follow",
  charging: false,
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialGame,

      // Best scores are saved between visits.
      bestScores: {},

      setPower: (power) =>
        set({
          power: Math.max(0.1, Math.min(1, power)),
        }),

      setAimAngle: (aimAngle) =>
        set({ aimAngle }),

      setTopSpin: (value) =>
        set({
          topSpin: Math.max(-1, Math.min(1, value)),
        }),

      setSideSpin: (value) =>
        set({
          sideSpin: Math.max(-1, Math.min(1, value)),
        }),

      resetSpin: () =>
        set({
          topSpin: 0,
          sideSpin: 0,
        }),

      setChargeMode: (mode) =>
        set({
          chargeMode: mode === "jump" ? "jump" : "normal",
        }),

      setCameraDistance: (distance) =>
        set({
          cameraDistance: Math.max(
            4,
            Math.min(15, distance)
          ),
        }),

      setCameraMode: (mode) =>
        set({
          cameraMode:
            mode === "overview" ? "overview" : "follow",
        }),

      toggleCameraMode: () =>
        set((state) => ({
          cameraMode:
            state.cameraMode === "follow"
              ? "overview"
              : "follow",
        })),

      setCharging: (charging) =>
        set({ charging }),

      recordStroke: () =>
        set((state) =>
          state.completed || state.gameComplete
            ? state
            : { strokes: state.strokes + 1 }
        ),

      // A course is unlocked after the previous
      // course has been completed at least once.
      isCourseUnlocked: (index) => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= courses.length
        ) {
          return false;
        }

        if (index === 0) return true;

        const previousCourse = courses[index - 1];

        return (
          get().bestScores[previousCourse.id] !== undefined
        );
      },

      completeHole: () =>
        set((state) => {
          if (state.completed || state.gameComplete) {
            return state;
          }

          const course = courses[state.courseIndex];
          if (!course) return state;

          const previousBest =
            state.bestScores[course.id];

          const best =
            previousBest === undefined
              ? state.strokes
              : Math.min(previousBest, state.strokes);

          const result = {
            courseId: course.id,
            name: course.name,
            par: course.par,
            strokes: state.strokes,
          };

          return {
            completed: true,
            charging: false,
            results: [
              ...state.results.filter(
                (item) => item.courseId !== course.id
              ),
              result,
            ],
            bestScores: {
              ...state.bestScores,
              [course.id]: best,
            },
          };
        }),

      nextCourse: () =>
        set((state) => {
          if (!state.completed) return state;

          const nextIndex = state.courseIndex + 1;

          if (nextIndex >= courses.length) {
            return {
              gameComplete: true,
              charging: false,
            };
          }

          return {
            courseIndex: nextIndex,
            sessionId: state.sessionId + 1,
            strokes: 0,
            completed: false,
            gameComplete: false,
            charging: false,
            power: 0.5,
            aimAngle: 0,
            cameraMode: "follow",
          };
        }),

      // Start a new round at an unlocked course.
      selectCourse: (index) => {
        if (!get().isCourseUnlocked(index)) {
          return false;
        }

        set((state) => ({
          courseIndex: index,
          sessionId: state.sessionId + 1,
          strokes: 0,
          results: [],
          completed: false,
          gameComplete: false,
          charging: false,
          power: 0.5,
          aimAngle: 0,
          cameraMode: "follow",
        }));

        return true;
      },

      restartCourse: () =>
        set((state) => {
          const course = courses[state.courseIndex];

          return {
            sessionId: state.sessionId + 1,
            strokes: 0,
            completed: false,
            gameComplete: false,
            charging: false,
            power: 0.5,
            aimAngle: 0,
            cameraMode: "follow",
            results: state.results.filter(
              (result) =>
                result.courseId !== course?.id
            ),
          };
        }),

      resetGame: () =>
        set((state) => ({
          ...initialGame,
          sessionId: state.sessionId + 1,
          results: [],
        })),

      // Optional: reset progression and best scores.
      clearProgress: () =>
        set((state) => ({
          ...initialGame,
          sessionId: state.sessionId + 1,
          results: [],
          bestScores: {},
        })),
    }),
    {
      name: "mini-golf-progress",

      // Persist best scores only, not the live
      // physics session or current round.
      partialize: (state) => ({
        bestScores: state.bestScores,
      }),
    }
  )
);

export default useGameStore;
