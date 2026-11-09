// src/screens/AchievementsScreen.jsx

import { useState } from "react";

import {
  ArrowLeft,
  Trophy,
  LockKeyhole,
  Check,
  Flag,
  Target,
  Star,
  Medal,
} from "lucide-react";

import {
  achievements,
  ACHIEVEMENT_CATEGORIES,
} from "../achievements/achievements";

import useAchievementStore from "../store/useAchievementStore";

const ICONS = {
  flag: Flag,
  target: Target,
  star: Star,
  medal: Medal,
  trophy: Trophy,
  lock: LockKeyhole,
};

export default function AchievementsScreen({
  onBack,
}) {
  const [filter, setFilter] = useState("All");

  const unlocked = useAchievementStore(
    (state) => state.unlocked
  );

  const total = achievements.length;

  const unlockedCount = achievements.filter(
    (achievement) => Boolean(unlocked[achievement.id])
  ).length;

  const percentage = total
    ? Math.round((unlockedCount / total) * 100)
    : 0;

  const categories = Object.values(
    ACHIEVEMENT_CATEGORIES
  );

  const filteredAchievements =
    filter === "All"
      ? achievements
      : achievements.filter(
          (achievement) =>
            achievement.category === filter
        );

  return (
    <main className="h-full w-full overflow-y-auto bg-[#101719] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-5 py-2.5 font-medium transition-colors hover:bg-[#40654e]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#567a45] bg-[#243723]">
            <Trophy
              size={32}
              className="text-[#a3ff12]"
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#67efb4]">
              Player Progress
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Achievements
            </h1>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-[#34484a] bg-[#1b292b] p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#a6bbba]">
                Achievements Unlocked
              </p>

              <p className="mt-1 text-3xl font-extrabold">
                {unlockedCount}
                <span className="text-lg text-[#809693]">
                  {" "}/ {total}
                </span>
              </p>
            </div>

            <span className="text-xl font-bold text-[#a3ff12]">
              {percentage}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#101719]">
            <div
              className="h-full rounded-full bg-[#a3ff12] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                filter === category
                  ? "border-[#a3ff12] bg-[#a3ff12] text-[#102015]"
                  : "border-[#34484a] bg-[#1b292b] text-[#a6bbba] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => {
            const unlockedData =
              unlocked[achievement.id];

            const isUnlocked =
              Boolean(unlockedData);

            const Icon =
              ICONS[achievement.icon] ??
              LockKeyhole;

            return (
              <article
                key={achievement.id}
                className={`flex min-h-[132px] gap-4 rounded-xl border p-4 transition-colors ${
                  isUnlocked
                    ? "border-[#648f43] bg-[#263626]"
                    : "border-[#34484a] bg-[#1b292b]"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    isUnlocked
                      ? "bg-[#a3ff12] text-[#102015]"
                      : "bg-[#29393b] text-[#829493]"
                  }`}
                >
                  {isUnlocked ? (
                    <Icon size={24} />
                  ) : (
                    <LockKeyhole size={22} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className={`font-bold ${
                        isUnlocked
                          ? "text-white"
                          : "text-[#b0bfbd]"
                      }`}
                    >
                      {achievement.title}
                    </h2>

                    {isUnlocked && (
                      <Check
                        size={18}
                        className="shrink-0 text-[#a3ff12]"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-relaxed text-[#829493]">
                    {achievement.description}
                  </p>

                  <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#617f79]">
                    {isUnlocked
                      ? "Unlocked"
                      : "Locked"}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
