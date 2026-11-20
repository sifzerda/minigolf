// src/courses/course11.js

import { createCourseShape } from "./courseBuilder";
import { hill, valley } from "./terrainPresets";

// COURSE 11 — TWO WAYS
// Two alternate routes with different hazards meet at the cup.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "compound",
  parts: [
      {
        type: "path",
        points: [
          [0, 9],
          [-1.8, 5],
          [-3, 0],
          [-2.2, -5],
          [0, -9]
        ],
        width: 3,
        curved: true
      },
      {
        type: "path",
        points: [
          [0, 9],
          [2.1, 5],
          [3.2, 0],
          [2.2, -5],
          [0, -9]
        ],
        width: 2.8,
        curved: true
      }
    ],
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course11 = {
  ...shape,
  id: "course-11",
  number: 11,
  name: "Two Ways",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [-2.6, 0, 2.2], size: [2.2, 2.4], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [2.4, 0, -2], size: [2, 2.8], color: "#d8bc7a" },
  ],
  ramps: [],
  obstacles: [],

  terrain: {
    width: 32,
    length: 42,
    resolution: 64,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      hill({
        position: [-2.8, 0],
        radius: 2.1,
        height: 0.3
      }),
      valley({
        position: [2.8, 0],
        radius: 2.2,
        depth: 0.2
      }),
    ],
  },
};

export default course11;
