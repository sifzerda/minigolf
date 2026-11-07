// src/components/GolfGame.jsx

import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { setupGame } from "../ecs/setupGame";
import GolfScene from "./GolfScene";
import useGameStore from "../store/useGameStore";

export default function GolfGame() {
  const [sessionId, setSessionId] = useState(0);

  // Initialize the ECS world once for this game.
  useState(() => {
    setupGame();
    return true;
  });

  const strokes = useGameStore((s) => s.strokes);
  const power = useGameStore((s) => s.power);
  const aimAngle = useGameStore((s) => s.aimAngle);
  const charging = useGameStore((s) => s.charging);
  const completed = useGameStore((s) => s.completed);

  const setPower = useGameStore((s) => s.setPower);
  const resetGame = useGameStore((s) => s.resetGame);

  const degrees =
    ((Math.round((aimAngle * 180) / Math.PI) % 360)
      + 360) % 360;

  function handleRestart() {
    resetGame();
    setSessionId((id) => id + 1);
  }

  return (
    <div className="game">
      <Canvas
        key={sessionId}
        shadows
        camera={{
          position: [0, 5, 15],
          fov: 55,
          near: 0.1,
          far: 100,
        }}
      >
        <GolfScene />
      </Canvas>

      <div className="hud">
        <h2>Mini Golf</h2>

        <p>Strokes: {strokes}</p>
        <p>Aim: {degrees}°</p>

        <label>
          Power: {Math.round(power * 100)}%
        </label>

        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={power}
          disabled={charging || completed}
          onChange={(e) =>
            setPower(Number(e.target.value))
          }
        />

        <div className="power-track">
          <div
            className="power-fill"
            style={{ width: `${power * 100}%` }}
          />
        </div>

        {charging && <p>Charging shot...</p>}

        {completed ? (
          <div className="completion">
            <h3>Hole Complete!</h3>
            <p>Completed in {strokes} strokes.</p>

            <button onClick={handleRestart}>
              Play Again
            </button>
          </div>
        ) : (
          <div className="controls-help">
            <p>Right drag: Aim</p>
            <p>Left hold/release: Shoot</p>
            <p>Mouse wheel: Zoom</p>
            <p>Space: Shoot</p>
            <p>R: Reset ball</p>
          </div>
        )}
      </div>
    </div>
  );
}
