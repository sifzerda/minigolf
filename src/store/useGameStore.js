// src/store/useGameStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { courses } from "../courses";

export const CLUB_COLORS = {
  orange: "#f36b4e",
  black: "#222222",
  yellow: "#f4d900",
  blue: "#344dc6",
  red: "#e32636",
  green: "#17a34a",
};

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
  shotRequest: null,
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialGame,

      bestScores: {},
      clubColor: "blue",
      shotSequence: 0,

      setClubColor: (color) =>
        set({
          clubColor: CLUB_COLORS[color]
            ? color
            : "blue",
        }),

      requestShot: (power, angle, jump = false) => {
        const state = get();

        if (
          state.completed ||
          state.gameComplete ||
          state.shotRequest
        ) {
          return false;
        }

        const id = state.shotSequence + 1;

        set({
          shotSequence: id,
          shotRequest: {
            id,
            power: clamp(power, 0.1, 1),
            angle,
            jump,
          },
          charging: false,
        });

        return true;
      },

      clearShotRequest: (id) =>
        set((state) =>
          state.shotRequest?.id === id
            ? { shotRequest: null }
            : {}
        ),

      setPower: (power) =>
        set({ power: clamp(power, 0.1, 1) }),

      setAimAngle: (aimAngle) =>
        set({ aimAngle }),

      setTopSpin: (value) =>
        set({ topSpin: clamp(value, -1, 1) }),

      setSideSpin: (value) =>
        set({ sideSpin: clamp(value, -1, 1) }),

      resetSpin: () =>
        set({ topSpin: 0, sideSpin: 0 }),

      setChargeMode: (mode) =>
        set({
          chargeMode:
            mode === "jump" ? "jump" : "normal",
        }),

      setCameraDistance: (distance) =>
        set({
          cameraDistance: clamp(distance, 4, 15),
        }),

      setCameraMode: (mode) =>
        set({
          cameraMode:
            mode === "overview"
              ? "overview"
              : "follow",
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

      isCourseUnlocked: (index) => {
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= courses.length
        ) {
          return false;
        }

        return (
          index === 0 ||
          get().bestScores[
          courses[index - 1].id
          ] !== undefined
        );
      },

      completeHole: () =>
        set((state) => {
          if (
            state.completed ||
            state.gameComplete
          ) {
            return state;
          }

          const course =
            courses[state.courseIndex];

          if (!course) return state;

          const previousBest =
            state.bestScores[course.id];

          const best =
            previousBest === undefined
              ? state.strokes
              : Math.min(
                previousBest,
                state.strokes
              );

          const result = {
            courseId: course.id,
            name: course.name,
            par: course.par,
            strokes: state.strokes,
          };

          const results = [
            ...state.results.filter(
              (item) =>
                item.courseId !== course.id
            ),
            result,
          ];

          const isLastCourse =
            state.courseIndex ===
            courses.length - 1;

          return {
            completed: true,
            gameComplete: isLastCourse,
            charging: false,
            shotRequest: null,
            results,
            bestScores: {
              ...state.bestScores,
              [course.id]: best,
            },
          };
        }),

      nextCourse: () =>
        set((state) => {
          if (
            !state.completed ||
            state.gameComplete
          ) {
            return state;
          }

          const nextIndex =
            state.courseIndex + 1;

          if (nextIndex >= courses.length) {
            return state;
          }

          return {
            courseIndex: nextIndex,
            sessionId: state.sessionId + 1,
            strokes: 0,
            completed: false,
            gameComplete: false,
            charging: false,
            shotRequest: null,
            power: 0.5,
            aimAngle: 0,
            cameraMode: "follow",
          };
        }),

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
          shotRequest: null,
          power: 0.5,
          aimAngle: 0,
          cameraMode: "follow",
        }));

        return true;
      },

      restartCourse: () =>
        set((state) => {
          const course =
            courses[state.courseIndex];

          return {
            sessionId: state.sessionId + 1,
            strokes: 0,
            completed: false,
            gameComplete: false,
            charging: false,
            shotRequest: null,
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
        })),

      clearProgress: () =>
        set((state) => ({
          ...initialGame,
          sessionId: state.sessionId + 1,
          bestScores: {},
        })),
    }),
    {
      name: "mini-golf-progress",
      partialize: (state) => ({
        bestScores: state.bestScores,
        clubColor: state.clubColor,
      }),
    }
  )
);

export default useGameStore;
