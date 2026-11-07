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

  surfaces: [],

  ramps: [],

  obstacles: [
    {
      type: "bumper",
      position: [0, 0.4, 0],
      radius: 0.4,
    },

    {
      type: "waterHazard",
      position: [0, -0.15, -5],
      size: [4, 0.5, 3],
      color: "#1479a8",
      respawnPosition: [0, 0.5, -2],
    },

    {
      type: "rotatingGate",
      position: [-1.5, 0.65, -5],
      size: [1.5, 1, 0.2],
      pivot: "left",
      direction: 1,
      speed: 1,
      phase: 0,
    },
    {
      type: "rotatingGate",
      position: [1.5, 0.65, -5],
      size: [1.5, 1, 0.2],
      pivot: "right",
      direction: -1,
      speed: 1,
      phase: 0,
    },

  ],
};

export default course03;
