// src/ecs/systems/BallMotion.js

import {
  BALL_RADIUS,
  PHYSICS,
} from "../constants/physics";

import { detectGround } from "./GroundDetection";
import { resolveSurface } from "./SurfaceSystem";

import {
  applyBallSpin,
  clearBallSpin,
} from "./ShotSystem";

const ZERO = { x: 0, y: 0, z: 0 };

const dot = (a, b) =>
  a.x * b.x +
  a.y * b.y +
  a.z * b.z;

const lengthSquared = (v) =>
  dot(v, v);

export function createBallMotionState() {
  return {
    settleTimer: 0,
    settled: false,
    surface: "grass",
  };
}

export function updateBallMotion(
  world,
  ball,
  motion,
  dt = 1 / 60
) {
  if (!world || !ball) return motion;

  if (ball.isSleeping()) {
    const ground = detectGround(world, ball);

    motion.surface = resolveSurface(
      ball.translation(),
      ground
    );

    motion.settleTimer = PHYSICS.settleTime;
    motion.settled = true;

    clearBallSpin(ball);

    return motion;
  }

  const ground = detectGround(world, ball);

  const surface = resolveSurface(
    ball.translation(),
    ground
  );

  motion.surface = surface;

  if (!ground) {
    motion.settleTimer = 0;
    motion.settled = false;

    return motion;
  }

  const config =
    PHYSICS.surfaces[surface] ??
    PHYSICS.surfaces.grass;

  const normal = ground.normal;

  let velocity = ball.linvel();
  let angular = ball.angvel();

  // Remove the velocity component perpendicular
  // to the ground to find rolling movement.
  const normalSpeed = dot(velocity, normal);

  const tangent = {
    x: velocity.x - normal.x * normalSpeed,
    y: velocity.y - normal.y * normalSpeed,
    z: velocity.z - normal.z * normalSpeed,
  };

  const tangentSpeed = Math.hypot(
    tangent.x,
    tangent.y,
    tangent.z
  );

  // Apply rolling resistance.
  if (tangentSpeed > 0.001) {
    const nextSpeed = Math.max(
      0,
      tangentSpeed - config.resistance * dt
    );

    const factor = nextSpeed / tangentSpeed;

    if (factor < 1) {
      velocity = {
        x:
          tangent.x * factor +
          normal.x * normalSpeed,
        y:
          tangent.y * factor +
          normal.y * normalSpeed,
        z:
          tangent.z * factor +
          normal.z * normalSpeed,
      };

      ball.setLinvel(velocity, true);
    }
  }

  // Correct angular velocity to match rolling.
  const updatedNormalSpeed =
    dot(velocity, normal);

  const rx =
    velocity.x -
    normal.x * updatedNormalSpeed;

  const ry =
    velocity.y -
    normal.y * updatedNormalSpeed;

  const rz =
    velocity.z -
    normal.z * updatedNormalSpeed;

  const rollingSpeedSquared =
    rx * rx + ry * ry + rz * rz;

  if (
    rollingSpeedSquared >
    PHYSICS.rolling.minRollingSpeed ** 2
  ) {
    const inverseRadius = 1 / BALL_RADIUS;

    const target = {
      x:
        (normal.y * rz - normal.z * ry) *
        inverseRadius,
      y:
        (normal.z * rx - normal.x * rz) *
        inverseRadius,
      z:
        (normal.x * ry - normal.y * rx) *
        inverseRadius,
    };

    const correction = Math.min(
      1,
      PHYSICS.rolling.angularCorrection *
        config.rollingGrip
    );

    if (correction > 0) {
      angular = {
        x:
          angular.x +
          (target.x - angular.x) * correction,
        y:
          angular.y +
          (target.y - angular.y) * correction,
        z:
          angular.z +
          (target.z - angular.z) * correction,
      };

      ball.setAngvel(angular, true);
    }
  }

  // Apply real shot spin.
  applyBallSpin(
    ball,
    dt,
    true,
    surface
  );

  velocity = ball.linvel();
  angular = ball.angvel();

  const linearSquared =
    lengthSquared(velocity);

  const angularSquared =
    lengthSquared(angular);

  const nearlyStopped =
    linearSquared < PHYSICS.stopSpeed ** 2 &&
    angularSquared < PHYSICS.stopSpin ** 2;

  motion.settleTimer = nearlyStopped
    ? motion.settleTimer + dt
    : 0;

  // Eliminate residual movement.
  if (
    linearSquared <
      PHYSICS.rolling.sleepSpeed ** 2 &&
    angularSquared <
      PHYSICS.rolling.sleepSpin ** 2 &&
    (linearSquared > 0 || angularSquared > 0)
  ) {
    ball.setLinvel(ZERO, true);
    ball.setAngvel(ZERO, true);
  }

  motion.settled =
    motion.settleTimer >=
    PHYSICS.settleTime;

  if (motion.settled) {
    clearBallSpin(ball);
  }

  return motion;
}
