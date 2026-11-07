// src/physics/HoleSensor.jsx

import { useRef } from "react";
import { useBeforePhysicsStep } from "@react-three/rapier";

import useGameStore from "../store/useGameStore";

export default function HoleSensor({ hole, ballRef }) {
  const triggeredRef = useRef(false);

  useBeforePhysicsStep(() => {
    if (triggeredRef.current) return;

    const ball = ballRef.current;
    if (!ball) return;

    const state = useGameStore.getState();

    if (state.completed || state.gameComplete) return;

    const position = ball.translation();
    const velocity = ball.linvel();

    const [holeX, holeY, holeZ] = hole.position;

    const dx = position.x - holeX;
    const dz = position.z - holeZ;

    const distance = Math.hypot(dx, dz);

    const horizontalSpeed = Math.hypot(
      velocity.x,
      velocity.z
    );

    // The ball must be inside the cup.
    const insideCup = distance < hole.radius * 0.75;

    // The ball must have fallen below the green.
    const belowSurface = position.y < holeY - 0.1;

    // Avoid completing when a fast ball passes over.
    const slowEnough = horizontalSpeed < 4;

    if (insideCup && belowSurface && slowEnough) {
      triggeredRef.current = true;

      state.completeHole();
    }
  });

  return null;
}
