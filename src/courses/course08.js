// src/courses/course08.js

import { createCourseShape } from "./courseBuilder";
import { brick, assembly, bridge, repeat } from "./bricks";

const course08 = {
  id: "course-08",
  number: 8,
  name: "Bricks and Rocks",
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
      [-3, -10], [3, -10],
      [4, -9], [4, 9],
      [3, 10], [-3, 10],
      [-4, 9], [-4, -9],
    ],
  }),

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: -0.15,
    color: "#328b50",

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

  surfaces: [],
  ramps: [],

  obstacles: [
    // Three small pyramids in a row.
    assembly({
      position: [0, 0, 3],
      terrainAlign: true,
      size: [4.4, 1, 1],

      parts: repeat(3, (index) =>
        brick.pyramid(
          [0.9, 0.8, 0.9],
          [(index - 1) * 1.5, 0.4, 0],
          { color: "#d99051" }
        )
      ),
    }),

    // Two walls connected by a top bar.
    assembly({
      position: [0, 0, -1],
      terrainAlign: true,
      size: [3.6, 2, 0.4],

      parts: [
        brick.box(
          [0.4, 2, 0.4],
          [-1.6, 1, 0]
        ),

        brick.box(
          [0.4, 2, 0.4],
          [1.6, 1, 0]
        ),

        brick.box(
          [3.6, 0.4, 0.4],
          [0, 1.8, 0]
        ),
      ],
    }),

    // Existing bridge recipe.
    bridge({
      position: [0, 1, -5],
      width: 3,
      length: 3,
    }),
  ],
};

export default course08;
