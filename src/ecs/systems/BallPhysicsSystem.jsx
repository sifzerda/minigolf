// src/ecs/systems/BallPhysicsSystem.jsx

import { useRef } from "react";
import {
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";

import {
  createBallMotionState,
  updateBallMotion,
} from "./BallMotion";

import { useGamePaused } from "../../context/GamePauseContext";

const DT = 1 / 60;

export default function BallPhysicsSystem({
  ballRef,
  settledRef,
  activeSurfaceRef,
}) {
  const { world } = useRapier();
  const paused = useGamePaused();

  const motion = useRef(createBallMotionState());

  useBeforePhysicsStep(() => {
    if (paused) return;

    const ball = ballRef.current;
    if (!ball) return;

    updateBallMotion(
      world,
      ball,
      motion.current,
      DT
    );

    settledRef.current = motion.current.settled;

    if (activeSurfaceRef) {
      activeSurfaceRef.current =
        motion.current.surface;
    }
  });

  return null;
}
