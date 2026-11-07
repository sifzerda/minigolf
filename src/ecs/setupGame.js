// src/ecs/setupGame.js

import { world } from "./world";

export function setupGame() {
  for (const entity of [...world.entities]) {
    world.remove(entity);
  }

  world.add({
    ball: true,
    position: [0, 0.25, 8],
    radius: 0.25,
  });

  world.add({
    hole: true,
    position: [0, 0, -8],
    radius: 0.43,
  });

  // Sand region
  world.add({
    surface: "sand",
    position: [2.5, 0, 1],
    size: [2, 3],
    color: "#d8bc7a",
  });

  // Ice region
  world.add({
    surface: "ice",
    position: [-2.5, 0, -2],
    size: [2, 3],
    color: "#9be8ff",
  });

  // Raised ramp, positioned off the main path.
const rampLength = 3;
const rampThickness = 0.2;
const rampAngle = -0.2;

world.add({
  ramp: true,
  surface: "grass",
  position: [
    2.5,
    (rampLength / 2) * Math.sin(Math.abs(rampAngle))
      + (rampThickness / 2) * Math.cos(rampAngle),
    -4.5,
  ],
  size: [2, rampThickness, rampLength],
  angle: rampAngle,
  color: "#4ca96a",
});
}