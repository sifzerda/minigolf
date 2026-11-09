// src/components/ShotPowerMeter.jsx

import useGameStore from "../store/useGameStore";

function getPowerColor(power) {
  if (power < 0.4) return "#a3ff12";
  if (power < 0.75) return "#ffd43b";
  return "#ff5252";
}

export default function ShotPowerMeter() {
  const power = useGameStore((s) => s.power);
  const charging = useGameStore((s) => s.charging);
  const chargeMode = useGameStore((s) => s.chargeMode);

  const percent = Math.round(power * 100);
  const color = getPowerColor(power);

  const chargingLabel =
    chargeMode === "jump"
      ? "CHARGING JUMP SHOT"
      : "CHARGING NORMAL SHOT";

  return (
    <div className="w-full max-w-80 rounded-2xl border border-[#a3ff12]/20 bg-black/40 p-3.5">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between gap-3 text-xs font-bold tracking-widest">
        <span className="text-white">
          {charging ? chargingLabel : "SHOT POWER"}
        </span>

        <strong
          className="text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {percent}%
        </strong>
      </div>

      {/* Power bar */}
      <div
        className="relative h-[18px] overflow-hidden rounded-lg border border-white/15 bg-[#17231b]"
        role="progressbar"
        aria-label="Shot power"
        aria-valuemin={10}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        {/* Power fill */}
        <div
          className={`h-full rounded-[inherit] transition-[width,background-color] duration-75 ease-linear ${
            charging
              ? "motion-safe:animate-pulse"
              : ""
          }`}
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            boxShadow: `0 0 16px ${color}80`,
          }}
        />

        {/* Percentage markers */}
        <div className="pointer-events-none absolute inset-0">
          {[25, 50, 75].map((value) => (
            <span
              key={value}
              className="absolute inset-y-0 w-px bg-white/40"
              style={{ left: `${value}%` }}
            />
          ))}
        </div>
      </div>

      {/* Footer labels */}
      <div className="mt-1.5 flex items-center justify-between text-[9px] tracking-wider text-[#9aa99d]">
        <span>SOFT</span>
        <span>MEDIUM</span>
        <span>MAX</span>
      </div>

      {/* Instructions */}
      <p className="mt-2.5 text-[11px] text-[#b8c7bc]">
        {charging
          ? "Release to shoot"
          : "Hold left mouse to charge"}
      </p>
    </div>
  );
}
