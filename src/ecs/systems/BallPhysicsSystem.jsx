// src/ecs/systems/BallPhysicsSystem.jsx

import { useRef } from "react";
import {
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";

import { PHYSICS } from "../constants/physics";
import { detectGround } from "./GroundDetection";
import { resolveSurface } from "./SurfaceSystem";

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

    const dt = 1 / 60;

    const ground = detectGround(world, ball);
    const position = ball.translation();
    const velocity = ball.linvel();
    const angular = ball.angvel();

    const surface = resolveSurface(position, ground);
    activeSurfaceRef.current = surface;

    const config =
      PHYSICS.surfaces[surface] ??
      PHYSICS.surfaces.grass;

    if (ground) {
      const n = ground.normal;

      // Remove the component perpendicular to
      // the surface to find tangential velocity.
      const dot =
        velocity.x * n.x +
        velocity.y * n.y +
        velocity.z * n.z;

      const tangent = {
        x: velocity.x - dot * n.x,
        y: velocity.y - dot * n.y,
        z: velocity.z - dot * n.z,
      };

      const tangentSpeed = Math.hypot(
        tangent.x,
        tangent.y,
        tangent.z
      );

      if (tangentSpeed > 0.01) {
        const deceleration =
          config.resistance * dt;

        const nextSpeed = Math.max(
          0,
          tangentSpeed - deceleration
        );

        const factor = nextSpeed / tangentSpeed;

        // Preserve the normal component.
        ball.setLinvel(
          {
            x: tangent.x * factor + dot * n.x,
            y: tangent.y * factor + dot * n.y,
            z: tangent.z * factor + dot * n.z,
          },
          true
        );
      }
    }

    const linearSpeed = Math.hypot(
      velocity.x,
      velocity.y,
      velocity.z
    );

    const angularSpeed = Math.hypot(
      angular.x,
      angular.y,
      angular.z
    );

    const nearlyStopped =
      linearSpeed < PHYSICS.stopSpeed &&
      angularSpeed < PHYSICS.stopSpin;

    if (ground && nearlyStopped) {
      settleTimer.current += dt;
    } else {
      settleTimer.current = 0;
    }

    settledRef.current =
      settleTimer.current >= PHYSICS.settleTime;
  });

  return null;
}
