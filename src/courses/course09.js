// src/courses/course09.js

import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const points = [[-4, -12], [4, -12], [4, 12], [-4, 12]];

const course09 = {
  id: "course-09",
  number: 9,
  name: "Island Crossing",
  environment: "garden",
  par: 5,
  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },
  sections: [createRectangularFloor({ id: "main-floor", width: 8, length: 24, color: "#378956" })],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    {
      type: "waterHazard", position: [-2.6, -0.15, 1],
      size: [2, 0.3, 4], color: "#1486b3", respawnPosition: [0, 0.5, 5],
    },
    {
      type: "waterHazard", position: [2.6, -0.15, -3],
      size: [2, 0.3, 4], color: "#1486b3", respawnPosition: [0, 0.5, 0],
    },
    { type: "block", position: [0, 0.35, 2], size: [1.5, 0.7, 0.7], color: "#7b6b57" },
    { type: "bumper", position: [-1.5, 0.4, -6], radius: 0.45, color: "#e6bb72" },
    { type: "bumper", position: [1.5, 0.4, -7], radius: 0.45, color: "#e6bb72" },
  ],
};

export default course09;
