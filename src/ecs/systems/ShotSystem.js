// src/ecs/systems/ShotSystem.js

import useGameStore from "../../store/useGameStore";

export const SHOT_IMPULSE = 2.5;
export const JUMP_IMPULSE = 1.8;

const activeSpin = new WeakMap();

const SPIN = {
  duration: 2.5,
  sideAcceleration: 3.0,
  forwardAcceleration: 2.0,
  minSpeed: 0.12,
};

const SURFACE_SPIN = {
  grass: 1,
  sand: 0.3,
  ice: 1.4,
  concrete: 0.85,
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export function getShotDirection(angle) {
  return {
    x: -Math.sin(angle),
    y: 0,
    z: -Math.cos(angle),
  };
}

export function getShotImpulse(power) {
  return clamp(power, 0.1, 1) * SHOT_IMPULSE;
}

export function getJumpImpulse(power) {
  return clamp(power, 0.1, 1) * JUMP_IMPULSE;
}

export function isBallStopped(ball, settledRef) {
  return Boolean(ball && settledRef?.current);
}

export function clearBallSpin(ball) {
  if (ball) activeSpin.delete(ball);
}

export function applyBallSpin(
  ball,
  dt,
  grounded,
  surface = "grass"
) {
  if (!ball || dt <= 0) return;

  const spin = activeSpin.get(ball);
  if (!spin) return;

  spin.elapsed += dt;

  if (spin.elapsed >= SPIN.duration) {
    clearBallSpin(ball);
    return;
  }

  if (!grounded) return;

  const velocity = ball.linvel();
  const speed = Math.hypot(
    velocity.x,
    velocity.z
  );

  if (speed < SPIN.minSpeed) {
    clearBallSpin(ball);
    return;
  }

  const strength = (
    1 - spin.elapsed / SPIN.duration
  ) ** 2;

  const factor =
    SURFACE_SPIN[surface] ?? 1;

  const forwardX = velocity.x / speed;
  const forwardZ = velocity.z / speed;

  const rightX = -forwardZ;
  const rightZ = forwardX;

  const sideAcceleration =
    spin.side *
    SPIN.sideAcceleration *
    strength *
    factor;

  const forwardAcceleration =
    spin.forward *
    SPIN.forwardAcceleration *
    strength *
    factor;

  const massDt = ball.mass() * dt;

  ball.applyImpulse(
    {
      x: massDt * (
        rightX * sideAcceleration +
        forwardX * forwardAcceleration
      ),
      y: 0,
      z: massDt * (
        rightZ * sideAcceleration +
        forwardZ * forwardAcceleration
      ),
    },
    true
  );
}

export function shootBall(
  ball,
  power,
  angle,
  settledRef,
  jump = false
) {
  const state = useGameStore.getState();

  if (
    !isBallStopped(ball, settledRef) ||
    state.completed ||
    state.gameComplete
  ) {
    return false;
  }

  const direction = getShotDirection(angle);
  const impulse = getShotImpulse(power);

  const verticalImpulse = jump
    ? getJumpImpulse(power)
    : 0;

  const forward = clamp(
    state.topSpin ?? 0,
    -1,
    1
  );

  const side = clamp(
    state.sideSpin ?? 0,
    -1,
    1
  );

  if (forward !== 0 || side !== 0) {
    activeSpin.set(ball, {
      forward,
      side,
      elapsed: 0,
    });
  } else {
    clearBallSpin(ball);
  }

  settledRef.current = false;

  ball.wakeUp();

  ball.applyImpulse(
    {
      x: direction.x * impulse,
      y: verticalImpulse,
      z: direction.z * impulse,
    },
    true
  );

  state.recordStroke();

  return true;
}

export function resetBall(
  ball,
  position,
  settledRef
) {
  if (!ball) return;

  clearBallSpin(ball);

  ball.setTranslation(
    {
      x: position[0],
      y: position[1],
      z: position[2],
    },
    true
  );

  ball.setLinvel(
    { x: 0, y: 0, z: 0 },
    true
  );

  ball.setAngvel(
    { x: 0, y: 0, z: 0 },
    true
  );

  ball.setRotation(
    { x: 0, y: 0, z: 0, w: 1 },
    true
  );

  if (settledRef) {
    settledRef.current = false;
  }
}
