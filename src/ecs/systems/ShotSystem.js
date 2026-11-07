// src/ecs/systems/ShotSystem.js

import useGameStore from "../../store/useGameStore";

const SHOT_IMPULSE = 2.5;
const STOP_THRESHOLD = 0.15;

export function getShotDirection(angle) {
  return {
    x: -Math.sin(angle),
    y: 0,
    z: -Math.cos(angle),
  };
}

export function isBallStopped(ball) {
  if (!ball) return false;

  const velocity = ball.linvel();
  const angular = ball.angvel();

  const speed = Math.hypot(
    velocity.x,
    velocity.y,
    velocity.z
  );

  const spin = Math.hypot(
    angular.x,
    angular.y,
    angular.z
  );

  return (
    speed < STOP_THRESHOLD &&
    spin < 0.5
  );
}

export function shootBall(ball, power, angle) {
  if (!ball) return false;

  const state = useGameStore.getState();

  if (state.completed || !isBallStopped(ball)) {
    return false;
  }

  const direction = getShotDirection(angle);
  const impulse = power * SHOT_IMPULSE;

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

export function resetBall(ball, position) {
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
}

