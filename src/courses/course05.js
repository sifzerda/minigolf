// src/courses/course05.js

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

const course05 = {
  id: "course-05",
  number: 5,
  name: "Windmill",
  par: 4,

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
      color: "#2d8951",
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [],

  ramps: [],

  obstacles: [
    {
      type: "windmill",
      position: [0, 0.4, 0],
      bladeLength: 5,
      bladeWidth: 0.35,
      speed: 1.5,
      color: "#eeeeee",
    },

    {
      type: "block",
      position: [-2.5, 0.4, -4],
      size: [1, 0.8, 1],
      color: "#888888",
    },

    {
      type: "block",
      position: [2.5, 0.4, -4],
      size: [1, 0.8, 1],
      color: "#888888",
    },

    {
      id: "platform-1",
      type: "movingPlatform",
      position: [0, 0.5, 0],
      size: [3, 0.3, 3],
      axis: "x",
      distance: 2,
      speed: 0.8,
      friction: 1.5,
      color: "#ffcc33",
    }
  ],
};

export default course05;
