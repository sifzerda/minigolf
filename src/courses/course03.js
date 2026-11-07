// src/courses/course03.js

import {
  createPolygonFloor,
  createPolygonWalls,
} from "./courseBuilder";

const points = [
  [-4, 10],
  [2, 10],
  [2, 4],
  [4, 4],
  [4, -3],
  [1, -3],
  [1, -10],
  [-4, -10],
  [-4, -5],
  [-1, -5],
  [-1, 2],
  [-4, 2],
];

const course03 = {
  id: "course-03",
  number: 3,
  name: "Zigzag",
  par: 4,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  sections: [
    createPolygonFloor({
      id: "main-floor",
      points,
      color: "#328b50",
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [],

  ramps: [],

  obstacles: [
    {
      type: "bumper",
      position: [0, 0.4, 0],
      radius: 0.4,
    },
  ],
};

export default course03;
