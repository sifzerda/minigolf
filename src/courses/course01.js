// src/courses/course01.js

import {
  createRectangularFloor,
  createPolygonWalls,
} from "./courseBuilder";

const points = [
  [-4, -10],
  [4, -10],
  [4, 10],
  [-4, 10],
];

const course01 = {
  id: "course-01",
  number: 1,
  name: "First Steps",
  environment: "garden",
  par: 2,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  sections: [
    createRectangularFloor({
      id: "main-floor",
      width: 8,
      length: 20,
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [],
  ramps: [],
  obstacles: [],

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,

    // Keep terrain below the playable course.
    baseHeight: -0.15,

    color: "#548a43",
    features: [],
  },
};

export default course01;
