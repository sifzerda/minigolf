// src/courses/course14.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 8;
const length = 24;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course14 = {
  id: "course-14",
  number: 14,
  name: "Frostbite Slalom",
  environment: "snow",
  par: 4,
  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#a9d5df",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "block", position: [-2.3, 0.45, 5], size: [2.8, 0.9, 0.45], color: "#e3f6fa" },
    { type: "block", position: [2.3, 0.45, 1], size: [2.8, 0.9, 0.45], color: "#d0ebf7" },
    { type: "block", position: [-2.3, 0.45, -3], size: [2.8, 0.9, 0.45], color: "#e3f6fa" },
    { type: "bumper", position: [1.4, 0.4, -7], radius: 0.55, color: "#61c7e5" },
  ],
};

export default course14;
