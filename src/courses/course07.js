// src/courses/course07.js

import { createPolygonFloor, createPolygonWalls } from "./courseBuilder";

const points = [
  [-3.5, 10], [3.5, 10], [3.5, 4], [1.5, 4],
  [1.5, 1], [4, 1], [4, -5], [2, -5],
  [2, -10], [-3.5, -10], [-3.5, -4], [-1.5, -4],
  [-1.5, 3], [-3.5, 3],
];

const course07 = {
  id: "course-07",
  number: 7,
  name: "Bridge",
  environment: "desert",
  par: 4,
  ballStart: [0, 0.25, 8],
  hole: { position: [0, 0, -8], radius: 0.43 },

  sections: [
    createPolygonFloor({
      id: "main-floor",
      points,
      color: "#b9935d",
    }),
  ],

  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "block", position: [0, 0.4, 4.5], size: [1.1, 0.8, 1.1], color: "#986c48" },
    { type: "bumper", position: [0.3, 0.4, -1], radius: 0.4, color: "#c47e48" },
    { type: "block", position: [2.7, 0.4, -3.5], size: [0.8, 0.8, 1.1], color: "#986c48" },

{
  type: "bridge",
  position: [0, 0.75, 4],
  size: [1.25, 0.125, 3],

  rails: true,
  railHeight: 0.25,
  railThickness: 0.06,

  ramps: true,
  rampLength: 2,
  rampThickness: 0.1,
  groundY: 0,

  friction: 0.8,
  color: "#80664c",
  railColor: "#4a3829",
}

  ],
};

export default course07;
