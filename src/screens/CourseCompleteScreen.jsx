// // src/screens/CourseSelectScreen.jsx

import { courses } from "../courses";
import useGameStore from "../store/useGameStore";

const primaryButton = "w-full rounded-lg bg-[#a3ff12] px-5 py-3.5 font-bold text-[#102015] transition-colors hover:bg-[#c4ff65]";
const secondaryButton = "w-full rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#40654e]";

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#476c51] bg-[#15251c] p-4 text-center">
      <div className="text-2xl font-bold text-white sm:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-xs text-[#a6bbba]">
        {label}
      </div>
    </div>
  );
}

export default function CourseCompleteScreen({
  onNext,
  onReplay,
  onSelect,
  onMenu,
}) {
  const courseIndex = useGameStore(
    (state) => state.courseIndex
  );
  const strokes = useGameStore(
    (state) => state.strokes
  );
  const bestScores = useGameStore(
    (state) => state.bestScores
  );

  const course = courses[courseIndex];

  if (!course) return null;

  const difference = strokes - course.par;
  const best = bestScores[course.id];

  const scoreLabel =
    difference === 0
      ? "Even Par"
      : difference > 0
        ? `+${difference} Over Par`
        : `${Math.abs(difference)} Under Par`;

  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto bg-[#101b16] px-4 py-8 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-[#476c51] bg-[#1d3025] p-6 text-center shadow-2xl sm:p-8">
        <div className="mb-5 text-5xl">
          ⛳
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#a3ff12] sm:text-4xl">
          Course Complete!
        </h1>

        <h2 className="mt-4 text-xl font-semibold">
          {course.name}
        </h2>

        <p className="mt-2 text-sm text-[#a6bbba]">
          Course {courseIndex + 1} of {courses.length}
        </p>

        <div className="my-7 grid grid-cols-3 gap-2 sm:gap-4">
          <Stat label="Strokes" value={strokes} />
          <Stat label="Par" value={course.par} />
          <Stat label="Best" value={best ?? "—"} />
        </div>

        <div className="mb-8 rounded-xl border border-[#a3ff12]/25 bg-[#a3ff12]/10 px-4 py-4">
          <p className="text-lg font-bold text-[#a3ff12]">
            {scoreLabel}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`${primaryButton} sm:col-span-2`}
            onClick={onNext}
          >
            Next Course
          </button>

          <button
            type="button"
            className={secondaryButton}
            onClick={onReplay}
          >
            Replay Course
          </button>

          <button
            type="button"
            className={secondaryButton}
            onClick={onSelect}
          >
            Course Selection
          </button>

          <button
            type="button"
            className={`${secondaryButton} sm:col-span-2`}
            onClick={onMenu}
          >
            Main Menu
          </button>
        </div>
      </section>
    </main>
  );
}
