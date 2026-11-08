// src/courses/course16.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 9;
const length = 26;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course16 = {
  id: "course-16",
  number: 16,
  name: "Clockwork Crossing",
  environment: "neon",
  par: 5,
  ballStart: [0, 0.25, 11],
  hole: { position: [0, 0, -11], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#245e5d",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "rotatingGate", position: [-2, 0.65, 4], size: [2.2, 1, 0.25], pivot: "left", speed: 0.9, direction: 1, color: "#00d8ff" },
    { type: "rotatingGate", position: [2, 0.65, 0], size: [2.2, 1, 0.25], pivot: "right", speed: 1.1, direction: -1, color: "#f9ad3d" },
    { type: "movingBarrier", position: [0, 0.5, -4.5], size: [1.5, 0.9, 0.3], distance: 2, speed: 0.85, color: "#b865f5" },
    { type: "bumper", position: [0, 0.4, -8], radius: 0.5, color: "#ff5599" },
  ],
};

export default course16;
