// src/ecs/systems/ShotSystem.js

import useGameStore from "../../store/useGameStore";

const SHOT_IMPULSE = 2.5;

export function getShotDirection(angle) {
  return {
    x: -Math.sin(angle),
    y: 0,
    z: -Math.cos(angle),
  };
}

export function isBallStopped(ball, settledRef) {
  return Boolean(ball && settledRef?.current);
}

export function shootBall(
  ball,
  power,
  angle,
  settledRef
) {
  const state = useGameStore.getState();

  if (
    !isBallStopped(ball, settledRef) ||
    state.completed
  ) {
    return false;
  }

  const direction = getShotDirection(angle);
  const impulse = Math.max(0.1, Math.min(1, power))
    * SHOT_IMPULSE;

  // Prevent another shot until the ball settles.
  settledRef.current = false;

  ball.wakeUp();

  ball.applyImpulse(
    {
      x: direction.x * impulse,
      y: 0,
      z: direction.z * impulse,
    },
    true
  );

  state.recordStroke();
  return true;
}

export function resetBall(ball, position, settledRef) {
  if (!ball) return;

  ball.setTranslation(
    {
      x: position[0],
      y: position[1],
      z: position[2],
    },
    true
  );

  ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ball.setAngvel({ x: 0, y: 0, z: 0 }, true);

  ball.setRotation(
    { x: 0, y: 0, z: 0, w: 1 },
    true
  );

  if (settledRef) settledRef.current = false;
}
