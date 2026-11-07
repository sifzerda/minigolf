// src/ecs/systems/GroundDetection.js

import { Ray } from "@dimforge/rapier3d-compat";
import {
  BALL_RADIUS,
  PHYSICS,
} from "../constants/physics";

const DOWN = { x: 0, y: -1, z: 0 };

export function detectGround(world, ball) {
  if (!world || !ball) return null;

  const position = ball.translation();

  const ray = new Ray(
    {
      x: position.x,
      y: position.y,
      z: position.z,
    },
    DOWN
  );

  const maxDistance =
    BALL_RADIUS + PHYSICS.groundProbeDistance;

  const hit = world.castRayAndGetNormal(
    ray,
    maxDistance,
    true,
    undefined,
    undefined,
    undefined,
    ball
  );

  if (!hit) return null;

  const normal = hit.normal;

  if (normal.y < PHYSICS.groundNormalMinY) {
    return null;
  }

  return {
    grounded: true,
    normal: {
      x: normal.x,
      y: normal.y,
      z: normal.z,
    },
    collider: hit.collider,
    distance: hit.timeOfImpact,
  };
}
