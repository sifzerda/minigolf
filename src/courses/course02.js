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
      position: [-1.5, 0, -3],
      size: [2, 3],
      color: "#d8bc7a",
    },
  ],

  ramps: [],

  obstacles: [
    {
      type: "bumper",
      position: [0, 0.4, 0],
      radius: 0.45,
    },

    {
      type: "rotatingGate",
      position: [0, 0.65, -5],
      size: [2, 1, 0.2],
      speed: 1.5,
      openAngle: Math.PI / 2,
      direction: 1,
      pivot: "left",
      color: "#e0a340",
    }

  ],
};

export default course02;
