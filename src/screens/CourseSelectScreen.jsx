// src/screens/CourseSelectScreen.jsx

import { ArrowLeft, Lock, CheckCircle2, Flag } from "lucide-react";
import { courses, TOTAL_COURSES } from "../courses";
import useGameStore from "../store/useGameStore";

export default function CourseSelectScreen({
  onPreview,
  onBack,
}) {
  const bestScores = useGameStore((state) => state.bestScores);
  const isCourseUnlocked = useGameStore((state) => state.isCourseUnlocked);

  const slots = Array.from(
    { length: TOTAL_COURSES },
    (_, index) => {
      const course = courses[index] ?? null;
      const best = course ? bestScores[course.id] : undefined;
      const completed = best !== undefined;
      const unlocked = Boolean(course) && isCourseUnlocked(index);

      return {
        index,
        course,
        best,
        completed,
        unlocked,
      };
    }
  );

  const completedCount = slots.filter((slot) => slot.completed).length;

  return (
    <main className="h-full w-full overflow-y-auto bg-[#101719] px-4 py-6 text-[#f4f7f7] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[42px]">
              Select Course
            </h1>

            <p className="mt-2 text-sm text-[#9db3b2]">
              {completedCount} / {TOTAL_COURSES} completed
            </p>
          </div>

          <button type="button" onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#40654e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67efb4]">
            <ArrowLeft size={18} />
            Back to Menu
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 overflow-hidden rounded-full bg-[#263b30]">
            <div
              className="h-full rounded-full bg-[#67efb4] transition-[width] duration-300"
              style={{
                width: `${
                  TOTAL_COURSES > 0
                    ? (completedCount / TOTAL_COURSES) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {slots.map((slot) => {
            const {
              index,
              course,
              best,
              completed,
              unlocked,
            } = slot;

            const statusClasses = completed
              ? "border-[#4c8eae] bg-[#1c3038] enabled:hover:border-[#6fc7f1] enabled:hover:bg-[#243d48]"
              : unlocked
                ? "border-[#4aaf87] bg-[#1b292b] enabled:hover:border-[#67efb4] enabled:hover:bg-[#243638]"
                : "cursor-not-allowed border-[#34484a] bg-[#161e20] opacity-50";

            const statusColor = completed
              ? "text-[#6fc7f1]"
              : unlocked
                ? "text-[#67efb4]"
                : "text-[#849393]";

            return (
              <button
                key={index}
                type="button"
                disabled={!unlocked}
                onClick={() => onPreview(index)}
                className={`
                  flex min-h-[175px] min-w-0 flex-col
                  justify-between gap-4 rounded-2xl
                  border p-3 text-left text-[#f4f7f7]
                  transition-all duration-150
                  enabled:cursor-pointer
                  enabled:hover:-translate-y-1
                  enabled:hover:shadow-lg
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-[#55e3b2]
                  sm:p-[18px]
                  ${statusClasses}
                `}
              >
                {/* Course number and status */}
                <div
                  className={`flex items-center justify-between gap-2 ${statusColor}`}
                >
                  <span className="text-xl font-bold sm:text-2xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {completed ? (
                    <CheckCircle2 size={20} />
                  ) : unlocked ? (
                    <Flag size={20} />
                  ) : (
                    <Lock size={18} />
                  )}
                </div>

                {/* Course details */}
                <div className="min-w-0">
                  <h3 className="mb-1.5 text-sm font-semibold leading-snug sm:text-base">
                    {course?.name ??
                      `Course ${index + 1}`}
                  </h3>

                  <p className="text-xs text-[#a6bbba] sm:text-[13px]">
                    {course
                      ? `Par ${course.par}`
                      : "Coming Soon"}
                  </p>
                </div>

                {/* Completion status */}
                <div className="text-xs text-[#a6bbba] sm:text-[13px]">
                  {completed ? (
                    <span className="font-medium text-[#6fc7f1]">
                      Best: {best} strokes
                    </span>
                  ) : unlocked ? (
                    <span className="font-medium text-[#67efb4]">
                      Play Course
                    </span>
                  ) : (
                    <span>
                      {course ? "Locked" : "Coming Soon"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
