// src/courses/course01.js

import { createCourseShape } from "./courseBuilder";

const course01 = {
  id: "course-01",
  number: 1,
  name: "Small Hill",
  environment: "garden",
  par: 2,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  ...createCourseShape({
    type: "rounded",

    points: [
      [-3, -10],
      [3, -10],
      [4, -9],
      [4, 0],
      [4, 9],
      [3, 10],
      [-3, 10],
      [-4, 9],
      [-4, 0],
      [-4, -9],
    ],

    samples: 5,
  }),

  surfaces: [],
  ramps: [],
  obstacles: [],

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: -0.15,
    color: "#548a43",

    features: [
      {
        type: "ridge",
        start: [-4, 0],
        end: [4, 0],
        width: 4,
        height: 0.9,
      },
    ],
  },
};

export default course01;
