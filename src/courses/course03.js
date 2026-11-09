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
  environment: "snow",
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

  surfaces: [
    {
      id: "water-01",
      type: "water",
      position: [0, 0, -5],
      points: [
        [-3, -4],
        [0, -3],
        [2, -4],
        [3, -6],
        [1, -8],
        [-2, -7],
      ],
      depth: 0.65,
      color: "#1479a8",
      basinColor: "#52636a",
      respawnPosition: [0, 0.5, -2],
    },
  ],

  ramps: [
    {
      id: "water-launch-ramp",
      position: [0, 0, -2],
      size: [2.0, 0.65, 1.6],
      angle: 0,
      surface: "concrete",
      color: "#CCFF00",
    },
  ],

  obstacles: [],
};

export default course03;
