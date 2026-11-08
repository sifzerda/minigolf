// src/courses/course11.js

import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const points = [[-4, -12], [4, -12], [4, 12], [-4, 12]];

const course11 = {
  id: "course-11",
  number: 11,
  name: "Neon Labyrinth",
  environment: "neon",
  par: 5,
  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },
  sections: [createRectangularFloor({ id: "main-floor", width: 8, length: 24, color: "#214e55" })],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "block", position: [-1.8, 0.4, 5], size: [3.2, 0.8, 0.35], color: "#00c5ff" },
    { type: "block", position: [1.8, 0.4, 1.5], size: [3.2, 0.8, 0.35], color: "#bb55ff" },
    { type: "turnstile", position: [0, 0.4, -2], bladeLength: 3.2, bladeWidth: 0.3, speed: 1.1, color: "#f5d15b" },
    { type: "block", position: [-1.8, 0.4, -5.5], size: [3.2, 0.8, 0.35], color: "#00c5ff" },
    { type: "bumper", position: [1.7, 0.4, -8], radius: 0.45, color: "#ff55a5" },
  ],
};

export default course11;
