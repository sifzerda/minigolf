// src/ecs/systems/BallPhysicsSystem.jsx

import { useRef } from "react";
import { useBeforePhysicsStep, useRapier } from "@react-three/rapier";
import { BALL_RADIUS, PHYSICS } from "../constants/physics";
import { detectGround } from "./GroundDetection";
import { resolveSurface } from "./SurfaceSystem";
import { applyBallSpin, clearBallSpin } from "./ShotSystem";

const DT = 1 / 60;
const ZERO = { x: 0, y: 0, z: 0 };

const lengthSquared = (v) => v.x * v.x + v.y * v.y + v.z * v.z;
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

export default function BallPhysicsSystem({
  ballRef,
  settledRef,
  activeSurfaceRef,
}) {
  const { world } = useRapier();
  const settleTimer = useRef(0);

  useBeforePhysicsStep(() => {
    const ball = ballRef.current;
    if (!ball) return;

    if (ball.isSleeping()) {
      settledRef.current = true;
      return;
    }

    const ground = detectGround(world, ball);
    const position = ball.translation();

    const surface = resolveSurface(position, ground);

    if (activeSurfaceRef) {
      activeSurfaceRef.current = surface;
    }

    const config =
      PHYSICS.surfaces[surface] ??
      PHYSICS.surfaces.grass;

    if (!ground) {
      settleTimer.current = 0;
      settledRef.current = false;
      return;
    }

    const normal = ground.normal;
    let velocity = ball.linvel();
    let angular = ball.angvel();

    const normalSpeed = dot(velocity, normal);

    const tx = velocity.x - normal.x * normalSpeed;
    const ty = velocity.y - normal.y * normalSpeed;
    const tz = velocity.z - normal.z * normalSpeed;

    const tangentSpeed = Math.hypot(tx, ty, tz);

    if (tangentSpeed > 0.001) {
      const nextSpeed = Math.max(
        0,
        tangentSpeed - config.resistance * DT
      );

      const factor = nextSpeed / tangentSpeed;

      if (factor < 1) {
        velocity = {
          x: tx * factor + normal.x * normalSpeed,
          y: ty * factor + normal.y * normalSpeed,
          z: tz * factor + normal.z * normalSpeed,
        };

        ball.setLinvel(velocity, true);
      }
    }

    const updatedNormalSpeed = dot(velocity, normal);

    const rx = velocity.x - normal.x * updatedNormalSpeed;
    const ry = velocity.y - normal.y * updatedNormalSpeed;
    const rz = velocity.z - normal.z * updatedNormalSpeed;

    const rollingSpeedSquared =
      rx * rx + ry * ry + rz * rz;

    const minRolling =
      PHYSICS.rolling.minRollingSpeed;

    if (rollingSpeedSquared > minRolling * minRolling) {
      const inverseRadius = 1 / BALL_RADIUS;

      const targetX =
        (normal.y * rz - normal.z * ry) * inverseRadius;

      const targetY =
        (normal.z * rx - normal.x * rz) * inverseRadius;

      const targetZ =
        (normal.x * ry - normal.y * rx) * inverseRadius;

      const correction = Math.min(
        1,
        PHYSICS.rolling.angularCorrection *
          config.rollingGrip
      );

      if (correction > 0) {
        angular = {
          x: angular.x + (targetX - angular.x) * correction,
          y: angular.y + (targetY - angular.y) * correction,
          z: angular.z + (targetZ - angular.z) * correction,
        };

        ball.setAngvel(angular, true);
      }
    }

    applyBallSpin(ball, DT, true, surface);

    velocity = ball.linvel();
    angular = ball.angvel();

    const linearSquared = lengthSquared(velocity);
    const angularSquared = lengthSquared(angular);

    const stopSpeedSquared =
      PHYSICS.stopSpeed * PHYSICS.stopSpeed;

    const stopSpinSquared =
      PHYSICS.stopSpin * PHYSICS.stopSpin;

    const nearlyStopped =
      linearSquared < stopSpeedSquared &&
      angularSquared < stopSpinSquared;

    settleTimer.current = nearlyStopped
      ? settleTimer.current + DT
      : 0;

    const sleepSpeedSquared =
      PHYSICS.rolling.sleepSpeed ** 2;

    const sleepSpinSquared =
      PHYSICS.rolling.sleepSpin ** 2;

    if (
      linearSquared < sleepSpeedSquared &&
      angularSquared < sleepSpinSquared &&
      (linearSquared > 0 || angularSquared > 0)
    ) {
      ball.setLinvel(ZERO, true);
      ball.setAngvel(ZERO, true);
    }

    settledRef.current =
      settleTimer.current >= PHYSICS.settleTime;

    if (settledRef.current) {
      clearBallSpin(ball);
    }
  });

  return null;
}
