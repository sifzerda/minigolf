// src/courses/course02.js

import {
  createPolygonFloor,
  createPolygonWalls,
} from "./courseBuilder";

const points = [
  [-4, 10],
  [4, 10],
  [4, 2],
  [2, 2],
  [2, -10],
  [-4, -10],
];

const course02 = {
  id: "course-02",
  number: 2,
  name: "The Bend",
  environment: "desert",
  par: 3,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  sections: [
    createPolygonFloor({
      id: "main-floor",
      points,
      color: "#267b49",
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [
    {
      surface: "sand",
      position: [-1.0, 0, -3], // x, y, z
      size: [6, 3], // width, height
      color: "#d8bc7a",
    },
  ],

  ramps: [],

  obstacles: [],
};

export default course02;
