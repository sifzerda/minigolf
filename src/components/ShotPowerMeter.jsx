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

    return (
        <div className="shot-power-meter">
            <div className="shot-power-header">
                <span>
                    {charging
                        ? chargeMode === "jump"
                            ? "CHARGING JUMP SHOT"
                            : "CHARGING NORMAL SHOT"
                        : "SHOT POWER"}
                </span>

                <strong style={{ color }}>
                    {percent}%
                </strong>
            </div>

            <div
                className={`shot-power-track ${charging ? "is-charging" : ""
                    }`}
                role="progressbar"
                aria-label="Shot power"
                aria-valuemin={10}
                aria-valuemax={100}
                aria-valuenow={percent}
            >
                <div
                    className="shot-power-fill"
                    style={{
                        width: `${percent}%`,
                        background: color,
                        boxShadow: `0 0 16px ${color}80`,
                    }}
                />

                <div className="shot-power-markers">
                    {[25, 50, 75].map((value) => (
                        <span
                            key={value}
                            style={{ left: `${value}%` }}
                        />
                    ))}
                </div>
            </div>

            <div className="shot-power-footer">
                <span>SOFT</span>
                <span>MEDIUM</span>
                <span>MAX</span>
            </div>

            <p className="shot-power-hint">
                {charging
                    ? "Release to shoot"
                    : "Hold left mouse to charge"}
            </p>
        </div>
    );
}

