// src/ecs/systems/BallPhysicsSystem.jsx

import { useRef } from "react";
import {
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";

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

const DT = 1 / 60;

const length = (v) =>
  Math.hypot(v.x, v.y, v.z);

const dot = (a, b) =>
  a.x * b.x +
  a.y * b.y +
  a.z * b.z;

function scale(v, factor) {
  return {
    x: v.x * factor,
    y: v.y * factor,
    z: v.z * factor,
  };
}

function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

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

    const ground = detectGround(world, ball);
    const position = ball.translation();

    const surface = resolveSurface(
      position,
      ground
    );

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

    // Separate movement along the ground
    // from movement perpendicular to it.
    const normalSpeed = dot(velocity, normal);

    const tangent = subtract(
      velocity,
      scale(normal, normalSpeed)
    );

    const tangentSpeed = length(tangent);

    // Surface rolling resistance.
    if (tangentSpeed > 0.001) {
      const nextSpeed = Math.max(
        0,
        tangentSpeed - config.resistance * DT
      );

      const factor = nextSpeed / tangentSpeed;

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

    // Rolling without slipping:
    // omega = (normal cross velocity) / radius
    const updatedNormalSpeed = dot(
      velocity,
      normal
    );

    const rollingVelocity = subtract(
      velocity,
      scale(normal, updatedNormalSpeed)
    );

    const rollingSpeed = length(
      rollingVelocity
    );

    if (
      rollingSpeed >
      PHYSICS.rolling.minRollingSpeed
    ) {
      const targetAngular = scale(
        cross(normal, rollingVelocity),
        1 / BALL_RADIUS
      );

      const correction = Math.min(
        1,
        PHYSICS.rolling.angularCorrection *
          config.rollingGrip
      );

      angular = {
        x:
          angular.x +
          (targetAngular.x - angular.x) *
            correction,
        y:
          angular.y +
          (targetAngular.y - angular.y) *
            correction,
        z:
          angular.z +
          (targetAngular.z - angular.z) *
            correction,
      };

      ball.setAngvel(angular, true);
    }

    // Existing gameplay spin forces.
    applyBallSpin(
      ball,
      DT,
      true,
      surface
    );

    velocity = ball.linvel();
    angular = ball.angvel();

    const linearSpeed = length(velocity);
    const angularSpeed = length(angular);

    const nearlyStopped =
      linearSpeed < PHYSICS.stopSpeed &&
      angularSpeed < PHYSICS.stopSpin;

    if (nearlyStopped) {
      settleTimer.current += DT;
    } else {
      settleTimer.current = 0;
    }

    if (
      linearSpeed <
        PHYSICS.rolling.sleepSpeed &&
      angularSpeed <
        PHYSICS.rolling.sleepSpin
    ) {
      // Remove tiny residual velocities.
      ball.setLinvel(
        { x: 0, y: 0, z: 0 },
        true
      );

      ball.setAngvel(
        { x: 0, y: 0, z: 0 },
        true
      );
    }

    settledRef.current =
      settleTimer.current >=
      PHYSICS.settleTime;

    if (settledRef.current) {
      clearBallSpin(ball);
    }
  });

  return null;
}
