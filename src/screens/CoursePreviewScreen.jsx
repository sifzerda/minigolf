// src/screens/CoursePreviewScreen.jsx

import { ArrowLeft, Play, Flag } from "lucide-react";
import { courses } from "../courses";
import CourseMapRenderer from "../renderers/CourseMapRenderer";
import useGameStore from "../store/useGameStore";

export default function CoursePreviewScreen({
  courseIndex,
  onBack,
  onPlay,
}) {
  const course = courses[courseIndex];

  const bestScores = useGameStore(
    (state) => state.bestScores
  );

  const selectCourse = useGameStore(
    (state) => state.selectCourse
  );

  if (!course) return null;

  const best = bestScores[course.id];

  function handlePlay() {
    if (selectCourse(courseIndex)) {
      onPlay();
    }
  }

  const stats = [
    { label: "Par", value: course.par },
    {
      label: "Best Score",
      value: best === undefined ? "—" : best,
    },
    {
      label: "Obstacles",
      value: course.obstacles?.length ?? 0,
    },
  ];

  return (
    <main className="h-full w-full overflow-y-auto bg-[#101719] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#40654e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67efb4]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Preview layout */}
        <div className="mt-8 grid grid-cols-1 items-center gap-8 md:mt-10 md:grid-cols-2 md:gap-10">
          {/* Course map */}
          <div className="flex min-w-0 justify-center">
            <div className="w-full max-w-[350px] overflow-hidden rounded-2xl border border-[#34484a] bg-[#152023] p-3 shadow-xl">
              <CourseMapRenderer course={course} />
            </div>
          </div>

          {/* Course details */}
          <div className="min-w-0">
            {/* Course number */}
            <div className="mb-4 flex items-center gap-2.5 text-[#67efb4]">
              <Flag size={24} />
              <span className="text-sm font-bold uppercase tracking-widest">
                Course {courseIndex + 1}
              </span>
            </div>

            {/* Course name */}
            <h1 className="mb-8 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[46px]">
              {course.name}
            </h1>

            {/* Course stats */}
            <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#34484a] bg-[#1b292b] p-3 sm:p-4"
                >
                  <span className="text-xs text-[#a6bbba]">
                    {stat.label}
                  </span>

                  <strong className="text-2xl font-bold text-white">
                    {stat.value}
                  </strong>
                </div>
              ))}
            </div>

            {/* Play button */}
            <button
              type="button"
              onClick={handlePlay}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#a3ff12] px-6 py-4 text-base font-bold text-[#102015] shadow-lg shadow-[#a3ff12]/10 transition-all hover:bg-[#c4ff65] hover:shadow-[#a3ff12]/20 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3ff12]"
            >
              <Play size={20} fill="currentColor" />
              Play Course
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}