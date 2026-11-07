// src/ecs/setupGame.js

import { world } from "./world";

export function setupGame() {
  // Clear previous entities.
  for (const entity of [...world.entities]) {
    world.remove(entity);
  }

  // Golf ball
  world.add({
    ball: true,
    position: [0, 0.25, 8],
    radius: 0.25,
    active: true,
  });

  // Hole
  world.add({
    hole: true,
    position: [0, 0, -8],
    radius: 0.35,
  });

  // Sample obstacle
  world.add({
    obstacle: true,
    type: "bumper",
    position: [1.5, 0.4, 0],
    radius: 0.4,
  });
}
