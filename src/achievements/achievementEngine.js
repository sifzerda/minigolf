// src/achievements/achievementEngine.js

import { achievements } from "./achievements";
import useAchievementStore from "../store/useAchievementStore";

const conditionHandlers = {
  courseCompleted: (condition, event) => {
    if (event.type !== "courseCompleted") {
      return false;
    }

    const relativeToPar =
      event.strokes - event.par;

    if (
      condition.maxRelativeToPar !== undefined &&
      relativeToPar > condition.maxRelativeToPar
    ) {
      return false;
    }

    if (
      condition.courseId &&
      event.courseId !== condition.courseId
    ) {
      return false;
    }

    return true;
  },
};

export function processAchievementEvent(event) {
  const store = useAchievementStore.getState();
  const newlyUnlocked = [];

  for (const achievement of achievements) {
    if (!achievement.condition) continue;

    if (store.isUnlocked(achievement.id)) {
      continue;
    }

    const handler =
      conditionHandlers[achievement.condition.type];

    if (!handler) continue;

    if (handler(achievement.condition, event)) {
      const unlocked =
        store.unlockAchievement(achievement.id);

      if (unlocked) {
        newlyUnlocked.push(achievement);
      }
    }
  }

  return newlyUnlocked;
}
