// src/courses/course12.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 8;
const length = 24;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course12 = {
  id: "course-12",
  number: 12,
  name: "Pendulum",
  environment: "desert",
  par: 5,
  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#b99b68",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "block", position: [-1.9, 0.4, 5], size: [3.4, 0.8, 0.45], color: "#8e674a" },
    { type: "block", position: [1.9, 0.4, 0.5], size: [3.4, 0.8, 0.45], color: "#8e674a" },
    { type: "block", position: [-1.9, 0.4, -4], size: [3.4, 0.8, 0.45], color: "#8e674a" },
    { type: "bumper", position: [2.7, 0.4, -7.2], radius: 0.45, color: "#cf8752" },

    {
      type: "swingingPendulum",
      position: [0, 2.2, 3],

      length: 1.5,
      bobRadius: 0.45,
      rodRadius: 0.055,

      amplitude: 0.6,
      speed: 1.5,
      axis: "x",

      friction: 0.65,
      restitution: 0.55,

      color: "#ef4444",
      rodColor: "#9ca3af",
    },

  ],
};

export default course12;
