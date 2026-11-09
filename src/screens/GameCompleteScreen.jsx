// src/screens/GameCompleteScreen.jsx

import { courses } from "../courses";
import useGameStore from "../store/useGameStore";

const primaryButton = "w-full rounded-lg bg-[#a3ff12] px-5 py-3.5 font-bold text-[#102015] transition-colors hover:bg-[#c4ff65]";
const secondaryButton = "w-full rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#40654e]";

function formatDifference(value) {
  return value > 0 ? `+${value}` : String(value);
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#476c51] bg-[#15251c] p-3 text-center sm:p-4">
      <div className="text-xl font-bold text-[#a3ff12] sm:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-xs text-[#a6bbba]">
        {label}
      </div>
    </div>
  );
}

export default function GameCompleteScreen({
  onPlayAgain,
  onReplay,
  onSelect,
  onMenu,
}) {
  const results = useGameStore(
    (state) => state.results
  );

  const totalStrokes = results.reduce(
    (sum, result) => sum + result.strokes,
    0
  );

  const totalPar = results.reduce(
    (sum, result) => sum + result.par,
    0
  );

  const difference = totalStrokes - totalPar;

  const resultMap = new Map(
    results.map((result) => [
      result.courseId,
      result,
    ])
  );

  return (
    <main className="h-full w-full overflow-y-auto bg-[#101b16] px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-[#476c51] bg-[#1d3025] p-5 text-center shadow-2xl sm:p-8">
        <div className="mb-4 text-5xl">
          🏆
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#a3ff12] sm:text-4xl">
          Game Complete!
        </h1>

        <h2 className="mt-3 text-xl font-semibold">
          Congratulations!
        </h2>

        <p className="mt-2 text-sm text-[#a6bbba]">
          You completed the final course.
        </p>

        <div className="my-7 grid grid-cols-3 gap-2 sm:gap-4">
          <Stat
            label="Courses Played"
            value={results.length}
          />

          <Stat
            label="Total Strokes"
            value={totalStrokes}
          />

          <Stat
            label="Against Par"
            value={formatDifference(difference)}
          />
        </div>

        <h3 className="mb-4 text-xl font-bold text-[#a3ff12]">
          Final Scorecard
        </h3>

        <div className="max-h-[360px] overflow-auto rounded-xl border border-[#476c51] bg-[#15251c]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-[#263b30] text-[#a3ff12]">
              <tr>
                <th className="px-4 py-3">
                  Course
                </th>
                <th className="px-3 py-3">
                  Par
                </th>
                <th className="px-3 py-3">
                  Strokes
                </th>
                <th className="px-3 py-3">
                  +/-
                </th>
              </tr>
            </thead>

            <tbody>
              {courses.map((course) => {
                const result =
                  resultMap.get(course.id);

                const diff = result
                  ? result.strokes - result.par
                  : null;

                return (
                  <tr
                    key={course.id}
                    className="border-b border-white/10 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium">
                      {course.name}
                    </td>

                    <td className="px-3 py-3 text-[#a6bbba]">
                      {course.par}
                    </td>

                    <td className="px-3 py-3">
                      {result?.strokes ?? "—"}
                    </td>

                    <td className="px-3 py-3">
                      {diff === null
                        ? "—"
                        : formatDifference(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="bg-[#263b30] font-bold text-[#a3ff12]">
              <tr>
                <td className="px-4 py-3">
                  Total
                </td>

                <td className="px-3 py-3">
                  {totalPar}
                </td>

                <td className="px-3 py-3">
                  {totalStrokes}
                </td>

                <td className="px-3 py-3">
                  {formatDifference(difference)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`${primaryButton} sm:col-span-2`}
            onClick={onPlayAgain}
          >
            Play Again
          </button>

          <button
            type="button"
            className={secondaryButton}
            onClick={onReplay}
          >
            Replay Final Course
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
