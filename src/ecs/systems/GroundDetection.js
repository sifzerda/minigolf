// src/ecs/systems/GroundDetection.js

import { Ray } from "@dimforge/rapier3d-compat";

import {
  BALL_RADIUS,
  PHYSICS,
} from "../constants/physics";

const DOWN = { x: 0, y: -1, z: 0 };

const groundRay = new Ray(
  { x: 0, y: 0, z: 0 },
  DOWN
);

export function detectGround(world, ball) {
  if (!world || !ball) return null;

  const position = ball.translation();

  groundRay.origin.x = position.x;
  groundRay.origin.y = position.y;
  groundRay.origin.z = position.z;

  const maxDistance =
    BALL_RADIUS + PHYSICS.groundProbeDistance;

  const hit = world.castRayAndGetNormal(
    groundRay,
    maxDistance,
    true,
    undefined,
    undefined,
    undefined,
    ball
  );

  if (!hit) return null;

  if (hit.normal.y < PHYSICS.groundNormalMinY) {
    return null;
  }

  return {
    grounded: true,
    normal: hit.normal,
    collider: hit.collider,
    distance: hit.timeOfImpact,
  };
}
