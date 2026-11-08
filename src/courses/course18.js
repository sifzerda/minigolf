// src/courses/course18.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 10;
const length = 30;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course18 = {
  id: "course-18",
  number: 18,
  name: "Final Approach",
  environment: "volcanic",
  par: 6,
  ballStart: [0, 0.25, 13],
  hole: { position: [0, 0, -13], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#574b47",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "waterHazard", position: [-3.6, -0.15, 5], size: [2, 0.3, 4], color: "#f26c32", respawnPosition: [0, 0.5, 10] },
    { type: "movingBarrier", position: [0, 0.5, 2], size: [2, 0.9, 0.3], distance: 2.5, speed: 0.8, color: "#ec8c43" },
    { type: "block", position: [3.2, 0.5, -2.5], size: [1.4, 1, 1.2], color: "#38383b" },
    { type: "rotatingGate", position: [-1.6, 0.65, -6], size: [2, 1, 0.25], pivot: "left", direction: 1, speed: 0.8, color: "#ff7c45" },
    { type: "rotatingGate", position: [1.6, 0.65, -6], size: [2, 1, 0.25], pivot: "right", direction: -1, speed: 0.8, color: "#ff7c45" },
    { type: "bumper", position: [0, 0.4, -10], radius: 0.5, color: "#ffbb68" },
  ],
};

export default course18;
