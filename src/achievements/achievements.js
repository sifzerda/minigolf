// src/achievements/achievements.js

export const ACHIEVEMENT_CATEGORIES = {
  ALL: "All",
  COURSES: "Courses",
  SCORING: "Scoring",
  SKILL: "Skill",
  SPECIAL: "Special",
};

const definedAchievements = [
  {
    id: "first-par",
    title: "Par for the Course",
    description: "Complete any course at or below par.",
    category: "Scoring",
    icon: "flag",
    condition: {
      type: "courseCompleted",
      maxRelativeToPar: 0,
    },
  },
];

const placeholders = Array.from(
  { length: 50 - definedAchievements.length },
  (_, index) => ({
    id: `achievement-${String(index + 2).padStart(3, "0")}`,
    title: "Unknown Achievement",
    description: "Requirements to be revealed.",
    category: "Special",
    icon: "lock",
    condition: null,
  })
);

export const achievements = [
  ...definedAchievements,
  ...placeholders,
];
