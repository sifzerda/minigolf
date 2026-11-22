// src/ecs/setupGame.js

import { world } from "./world";
import { BALL_RADIUS } from "./constants/physics";

import {
  getCourseHeight,
  alignPositionToCourse,
  alignObjectToTerrain,
} from "../terrain/Terrain";

export function clearGame() {
  for (const entity of [...world.entities]) {
    world.remove(entity);
  }
}

export function setupGame(course) {
  if (!course) {
    throw new Error(
      "A valid course is required"
    );
  }

  const [startX, , startZ] = course.ballStart;

  const ballPosition = [
    startX,
    getCourseHeight(
      startX,
      startZ,
      course.terrain
    ) + BALL_RADIUS + 0.05,
    startZ,
  ];

  const holePosition = alignPositionToCourse(
    course.hole.position,
    course.terrain
  );

  clearGame();

  world.add({
    id: `${course.id}-ball`,
    ball: true,
    position: ballPosition,
    radius: BALL_RADIUS,
  });


  world.add({
    id: `${course.id}-hole`,
    hole: true,
    position: holePosition,
    radius: course.hole.radius,
  });


  for (const [index, surface] of
    (course.surfaces ?? []).entries()) {

    world.add({
      ...surface,
      surface:
        surface.surface ??
        surface.type ??
        "grass",
      id: `${course.id}-surface-${surface.id ?? index}`,
    });
  }

  (course.ramps ?? []).forEach(
    (ramp, index) => {
      world.add({
        ...ramp,
        ramp: true,
        id: `${course.id}-ramp-${index}`,
      });
    }
  );

  (course.obstacles ?? []).forEach(
    (obstacle, index) => {
      world.add({
        ...alignObjectToTerrain(
          obstacle,
          course.terrain
        ),
        obstacle: true,
        id: `${course.id}-obstacle-${index}`,
        respawnPosition:
          obstacle.respawnPosition ??
          [...course.ballStart],
      });
    }
  );
}
