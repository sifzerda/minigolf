// src/courses/course02.js

import { createCourseShape } from "./courseBuilder";

const course02 = {
  id: "course-02",
  number: 2,
  name: "The Sandy Fork",
  environment: "desert",
  par: 3,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  ...createCourseShape({
    type: "rounded",

    points: [
      [-4, 10],
      [4, 10],
      [5, 9],
      [5, -9],
      [4, -10],
      [-4, -10],
      [-5, -9],
      [-5, 9],
    ],

    samples: 6,

    holes: [
      {
        type: "polygon",
        points: [
          [-0.4, 3],
          [1.2, 2.5],
          [1.8, 1],
          [1.8, -2],
          [1.2, -3.5],
          [-0.4, -4],
          [-1.1, -2],
          [-1.1, 1],
        ],
      },
    ],

    color: "#398f53",

    wall: {
      color: "#806d55",
    },
  }),

  surfaces: [
    {
      surface: "sand",
      position: [-3, 0, -0.5],
      size: [3.4, 7],
      color: "#d8bc7a",
    },
  ],

  ramps: [],
  obstacles: [],

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: -0.15,
    defaultSurface: "sand",
    features: [],
  },
};

export default course02;
