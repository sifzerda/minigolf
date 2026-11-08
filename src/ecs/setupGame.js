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
const [startX, startY, startZ] = course.ballStart;
const ballPosition = course.terrain
  ? [
      startX,
      getTerrainHeight(
        startX,
        startZ,
        course.terrain
      ) + BALL_RADIUS + 0.05,
      startZ,
    ]
  : [startX, startY, startZ];


  if (!course) {
    throw new Error("A valid course is required");
  }

  clearGame();

  

  world.add({
    id: `${course.id}-ball`,
    ball: true,
    position: ballPosition,
    radius: 0.25,
  });

  world.add({
    id: `${course.id}-hole`,
    hole: true,
    position: [...course.hole.position],
    radius: course.hole.radius,
  });

  course.surfaces.forEach((surface, index) => {
    world.add({
      ...surface,
      id: `${course.id}-surface-${index}`,
    });
  });

  course.ramps.forEach((ramp, index) => {
    world.add({
      ...ramp,
      ramp: true,
      id: `${course.id}-ramp-${index}`,
    });
  });

  course.obstacles.forEach((obstacle, index) => {
    world.add({
      ...obstacle,
      obstacle: true,
      id: `${course.id}-obstacle-${index}`,
      respawnPosition:
        obstacle.respawnPosition ??
        [...course.ballStart],
    });
  });
}
