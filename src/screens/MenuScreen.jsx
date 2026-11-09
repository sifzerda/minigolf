// src/screens/MenuScreen.jsx

import {
  Flag,
  Play,
  Trophy,
  Settings,
  Medal,
} from "lucide-react";

import { TOTAL_COURSES } from "../courses";
import useGameStore from "../store/useGameStore";

export default function MenuScreen({
  onPlay,
  onSelectCourses,
  onAchievements,
  onSettings,
}) {
  const bestScores = useGameStore((s) => s.bestScores);

  const completedCount = Object.keys(bestScores).length;

  const primaryButton =
    "flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#a3ff12] px-6 py-4 text-base font-bold text-[#102015] shadow-lg shadow-[#a3ff12]/10 transition-all hover:bg-[#c4ff65] hover:shadow-[#a3ff12]/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3ff12]";

  const secondaryButton =
    "flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#6e9d7c] bg-[#304c3d] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#40654e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67efb4]";

  return (
    <main className="flex h-full min-h-screen w-full items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_center,#1c3833,#101719_70%)] px-5 py-10 text-white">
      <div className="w-full max-w-[460px] text-center">
        {/* Icon */}
        <Flag
          size={48}
          strokeWidth={1.8}
          className="mx-auto mb-5 text-[#67efb4]"
        />

        {/* Title */}
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-[68px]">
          Mini Golf
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-[#a6bbba] sm:text-base">
          Complete all {TOTAL_COURSES} courses and beat your best scores.
        </p>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2.5 text-[#67efb4]">
          <Trophy size={20} />

          <span className="text-sm font-semibold">
            {completedCount} / {TOTAL_COURSES} Completed
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onPlay}
            className={primaryButton}
          >
            <Play size={18} fill="currentColor" />
            Play
          </button>

          <button
            type="button"
            onClick={onSelectCourses}
            className={secondaryButton}
          >
            <Flag size={18} />
            Select Course
          </button>

          <button
            type="button"
            onClick={onAchievements}
            className={secondaryButton}
          >
            <Medal size={18} />
            Achievements
          </button>

          <button
            type="button"
            onClick={onSettings}
            className={secondaryButton}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>
    </main>
  );
}
