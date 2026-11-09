// src/store/useAchievementStore.js


import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAchievementStore = create(
  persist(
    (set, get) => ({
      unlocked: {},

      unlockAchievement: (id) => {
        if (get().unlocked[id]) return false;

        set((state) => ({
          unlocked: {
            ...state.unlocked,
            [id]: {
              unlockedAt: new Date().toISOString(),
            },
          },
        }));

        return true;
      },

      isUnlocked: (id) =>
        Boolean(get().unlocked[id]),

      resetAchievements: () =>
        set({ unlocked: {} }),
    }),
    {
      name: "mini-golf-achievements",
      version: 1,
      partialize: (state) => ({
        unlocked: state.unlocked,
      }),
    }
  )
);

export default useAchievementStore;
