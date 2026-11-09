// src/screens/PauseScreen.jsx

import { useEffect } from "react";
import {
  Play,
  RotateCcw,
  List,
  Flag,
  Trophy,
  Target,
  Hash,
  Pause,
} from "lucide-react";

import { courses } from "../courses";
import useGameStore from "../store/useGameStore";

const secondaryButton =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-[#6e9d7c] bg-[#304c3d] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#40654e]";

function formatScore(value) {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : String(value);
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#476c51] bg-[#15251c] p-3 text-center sm:p-4">
      <Icon
        size={20}
        className="mx-auto mb-2 text-[#67efb4]"
      />

      <p className="text-2xl font-bold text-[#a3ff12]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#a6bbba]">
        {label}
      </p>
    </div>
  );
}

export default function PauseScreen({
  onResume,
  onRestart,
  onSelect,
}) {
  const courseIndex = useGameStore((s) => s.courseIndex);
  const strokes = useGameStore((s) => s.strokes);
  const results = useGameStore((s) => s.results);
  const bestScores = useGameStore((s) => s.bestScores);

  const course = courses[courseIndex];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.code === "Escape" && !event.repeat) {
        event.preventDefault();
        onResume();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onResume]);

  if (!course) return null;

  const best = bestScores[course.id];
  const difference = strokes - course.par;

  const previousResults = results.filter(
    (result) => result.courseId !== course.id
  );

  const rows = [
    ...previousResults.map((result) => ({
      id: result.courseId,
      name:
        courses.find((item) => item.id === result.courseId)
          ?.name ?? String(result.courseId),
      par: result.par,
      strokes: result.strokes,
      current: false,
    })),
    {
      id: course.id,
      name: course.name,
      par: course.par,
      strokes,
      current: true,
    },
  ];

  const totalStrokes = rows.reduce(
    (sum, row) => sum + row.strokes,
    0
  );

  const totalPar = rows.reduce(
    (sum, row) => sum + row.par,
    0
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#476c51] bg-[#1d3025] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-white/10 p-5 text-center sm:p-6">
          <Pause
            size={30}
            className="mx-auto mb-3 text-[#a3ff12]"
          />

          <h1
            id="pause-title"
            className="text-3xl font-extrabold text-[#a3ff12]"
          >
            Game Paused
          </h1>

          <p className="mt-2 text-sm text-[#a6bbba]">
            Course {courseIndex + 1} — {course.name}
          </p>
        </div>

        {/* Scorecard */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold">
            Scorecard
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={Hash}
              label="Strokes"
              value={strokes}
            />

            <Stat
              icon={Flag}
              label="Par"
              value={course.par}
            />

            <Stat
              icon={Target}
              label="Against Par"
              value={formatScore(difference)}
            />

            <Stat
              icon={Trophy}
              label="Personal Best"
              value={best ?? "—"}
            />
          </div>

          <h3 className="mb-3 mt-7 text-lg font-bold text-[#a3ff12]">
            Current Round
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[#476c51] bg-[#15251c]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#263b30] text-[#a3ff12]">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-3 py-3">Par</th>
                  <th className="px-3 py-3">Strokes</th>
                  <th className="px-3 py-3">+/-</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const diff = row.strokes - row.par;

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-white/10 ${
                        row.current
                          ? "bg-[#a3ff12]/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.name}

                        {row.current && (
                          <span className="ml-2 text-xs text-[#a3ff12]">
                            (Playing)
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {row.par}
                      </td>

                      <td className="px-3 py-3">
                        {row.strokes}
                      </td>

                      <td className="px-3 py-3">
                        {formatScore(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-[#263b30] font-bold text-[#a3ff12]">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-3 py-3">{totalPar}</td>
                  <td className="px-3 py-3">
                    {totalStrokes}
                  </td>
                  <td className="px-3 py-3">
                    {formatScore(totalStrokes - totalPar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-5 sm:grid-cols-2 sm:p-6">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a3ff12] px-5 py-3.5 font-bold text-[#102015] transition-colors hover:bg-[#c4ff65] sm:col-span-2"
          >
            <Play size={18} fill="currentColor" />
            Resume Game
          </button>

          <button
            type="button"
            onClick={onRestart}
            className={secondaryButton}
          >
            <RotateCcw size={18} />
            Restart Course
          </button>

          <button
            type="button"
            onClick={onSelect}
            className={secondaryButton}
          >
            <List size={18} />
            Course Selection
          </button>
        </div>
      </section>
    </div>
  );
}
