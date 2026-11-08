// src/courses/course04.js

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

const course04 = {
  id: "course-04",
  number: 4,
  name: "Moving Target",
  environment: "volcanic",
  par: 3,

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
      color: "#28854d",
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [],
  ramps: [],

  obstacles: [
    {
      type: "movingBarrier",
      position: [0, 0.4, 0],
      size: [2, 0.8, 0.35],
      distance: 2.5,
      speed: 1.5,
      color: "#ffcc33",
    },

    {
      type: "bumper",
      position: [-1.5, 0.45, -4],
      radius: 0.45,
      color: "#ff5555",
    },

    {
      type: "bumper",
      position: [1.5, 0.45, -4],
      radius: 0.45,
      color: "#ff5555",
    },

    {
      id: "elevator-1",
      type: "movingPlatform",
      position: [0, 1, 0],
      size: [3, 0.3, 3],
      axis: "y",
      distance: 0.7,
      speed: 0.5,
      color: "#48c9ff",
    },

    {
      type: "plateau",
      position: [5, -4],
      radius: 4,
      height: 2.5,
      edgeWidth: 1.5,
    },

    {
      type: "cliff",
      start: [-8, -6],
      end: [8, -6],
      height: 3.5,
      sharpness: 0.6,
    },

    {
      type: "ledge",
      start: [-6, 5],
      end: [6, -5],
      width: 2.5,
      height: 2,
      edgeWidth: 0.7,
    },

  ],
};

export default course04;

