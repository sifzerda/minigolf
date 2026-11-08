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
    baseHeight: 0,
    color: "#548a43",

    features: [
      {
        type: "hill",
        position: [-6, -4],
        radius: 9,
        height: 2.5,
      },

      {
        type: "hill",
        position: [7, 6],
        radius: 7,
        height: 1.5,
      },

      {
        type: "valley",
        position: [2, -8],
        radius: 6,
        depth: 1.2,
      },

      {
        type: "ridge",
        start: [-8, -12],
        end: [-3, 10],
        width: 3,
        height: 1.2,
      },
    ],
  },

};

export default course01;
