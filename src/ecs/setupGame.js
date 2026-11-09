// src/ecs/setupGame.js

import { world } from "./world";
import { getTerrainHeight } from "../terrain/TerrainFeatures";
import { BALL_RADIUS } from "./constants/physics";

export function clearGame() {
  for (const entity of [...world.entities]) {
    world.remove(entity);
  }
}

export function setupGame(course) {
  if (!course) {
    throw new Error("A valid course is required");
  }

  clearGame();

  // Calculate starting ball position.
  const [startX, startY, startZ] = course.ballStart;

  const ballPosition = course.terrain
    ? [ startX, getTerrainHeight(startX, startZ, course.terrain) + BALL_RADIUS + 0.05, startZ ]
    : [startX, startY, startZ];

  // Golf ball.
  world.add({
    id: `${course.id}-ball`,
    ball: true,
    position: ballPosition,
    radius: BALL_RADIUS,
  });

  // Hole.
  world.add({
    id: `${course.id}-hole`,
    hole: true,
    position: [...course.hole.position],
    radius: course.hole.radius,
  });

  // Surface entities
  (course.surfaces ?? []).forEach((surface, index) => {
    world.add({
      ...surface,
      id: surface.id ?? `${course.id}-surface-${index}`,
      surface: surface.surface ?? surface.type ?? "grass",
      respawnPosition: surface.respawnPosition ?? [...ballPosition],
    });
  });

  // Ramp entities.
  (course.ramps ?? []).forEach(
    (ramp, index) => {
      world.add({
        ...ramp,
        ramp: true,
        id: `${course.id}-ramp-${index}`,
      });
    }
  );

  // Obstacle entities.
  (course.obstacles ?? []).forEach(
    (obstacle, index) => {
      world.add({
        ...obstacle,
        obstacle: true,
        id: `${course.id}-obstacle-${index}`,
        respawnPosition: obstacle.respawnPosition ?? [...ballPosition],
      });
    }
  );
}
