// src/screens/SettingsScreen.jsx

import { Check, ArrowLeft } from "lucide-react";

import useGameStore, {
  CLUB_COLORS,
} from "../store/useGameStore";

export default function SettingsScreen({ onBack }) {
  const clubColor = useGameStore((s) => s.clubColor);
  const setClubColor = useGameStore((s) => s.setClubColor);

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center overflow-y-auto bg-[#101b16] px-4 py-8 text-white">

      <div className="w-full max-w-xl rounded-2xl border border-[#476c51] bg-[#1d3025] p-6 shadow-2xl sm:p-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#a3ff12] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-3 text-sm text-[#c5d6cc]">
            Customise your mini-golf experience
          </p>
        </div>

        {/* Club Colour */}
        <section className="rounded-xl border border-white/10 bg-black/20 p-5 sm:p-6">

          <div className="mb-5 text-center">
            <h2 className="text-lg font-bold text-white">
              Golf Club Colour
            </h2>

            <p className="mt-2 text-sm text-[#c5d6cc]">
              Choose the colour of your golf club.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Golf club colour"
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {Object.entries(CLUB_COLORS).map(
              ([name, color]) => {
                const selected = clubColor === name;

                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${name} golf club`}
                    onClick={() => setClubColor(name)}
                    className={`
                      relative flex h-20 w-20 flex-col
                      items-center justify-center gap-2
                      rounded-xl border-2
                      transition-all duration-150
                      hover:-translate-y-1
                      hover:shadow-lg
                      focus-visible:outline-2
                      focus-visible:outline-offset-4
                      focus-visible:outline-[#a3ff12]
                      ${
                        selected
                          ? "border-[#a3ff12] bg-[#304c3d] shadow-[0_0_15px_rgba(163,255,18,0.15)]"
                          : "border-white/10 bg-[#15251c] hover:border-white/40"
                      }
                    `}
                  >
                    {/* Colour swatch */}
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: color }}
                    >
                      {selected && (
                        <Check
                          size={20}
                          strokeWidth={3}
                          className="text-white drop-shadow-[0_1px_2px_black]"
                        />
                      )}
                    </span>

                    {/* Colour name */}
                    <span className="text-xs font-semibold capitalize text-white">
                      {name}
                    </span>
                  </button>
                );
              }
            )}
          </div>

        </section>

        {/* Footer */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="
              flex w-full max-w-xs
              items-center justify-center gap-2
              rounded-xl border border-[#6e9d7c]
              bg-[#304c3d] px-6 py-3
              text-sm font-bold text-white
              transition-colors
              hover:bg-[#40654e]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#a3ff12]
            "
          >
            <ArrowLeft size={18} />
            Back to Menu
          </button>
        </div>

      </div>
    </div>
  );
}
