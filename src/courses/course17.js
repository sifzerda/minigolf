// src/courses/course17.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 8;
const length = 26;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course17 = {
  id: "course-17",
  number: 17,
  name: "Desert Passage",
  environment: "desert",
  par: 5,
  ballStart: [0, 0.25, 11],
  hole: { position: [0, 0, -11], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#c4a26b",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "tunnel", position: [0, 0.85, 3], size: [2.4, 1.7, 4], thickness: 0.18, color: "#90745c" },
    { type: "block", position: [-2.1, 0.45, -1.5], size: [1.5, 0.9, 1.2], color: "#a77b50" },
    { type: "block", position: [2.1, 0.45, -4], size: [1.5, 0.9, 1.2], color: "#a77b50" },
    { type: "bumper", position: [0, 0.4, -8.5], radius: 0.45, color: "#e3a04c" },
  ],
};

export default course17;
