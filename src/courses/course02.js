// src/courses/course02.js

import { createLayoutCourse } from "./layoutCourse.js";
import { surfaceBrick } from "./terrainBricks.js";

// ============================================================
// COURSE 02 — SAND FORK
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#806d55";
const SAND_COLOR = "#d8bc7a";

const course02 = createLayoutCourse({
  id: "course-02",
  number: 2,
  name: "Sand Fork",
  environment: "garden",
  par: 3,

  // ----------------------------------------------------------
  // START AND HOLE
  // ----------------------------------------------------------

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // PLAYABLE COURSE SHAPE
  // ----------------------------------------------------------

  shape: {
    type: "rounded",

    points: [
      [-3.8, 10],
      [3.8, 10],
      [4.8, 9],
      [4.8, 6.5],
      [4.1, 5],
      [3.4, 3.5],
      [3.8, 2],
      [4.8, 0.5],
      [5.2, -1.5],
      [4.7, -3.5],
      [3.7, -5],
      [4.2, -7],
      [4.8, -9],
      [3.8, -10],
      [-3.8, -10],
      [-4.8, -9],
      [-4.8, -6.5],
      [-4.1, -5],
      [-3.4, -3.5],
      [-3.8, -2],
      [-4.8, -0.5],
      [-5.2, 1.5],
      [-4.7, 3.5],
      [-3.7, 5],
      [-4.2, 7],
      [-4.8, 9],
    ],

    tolerance: 0.025,
    maxSegmentLength: 0.5,

    // Asymmetric island separates the playable
    // floor into two possible routes.
    holes: [
      {
        type: "polygon",

        points: [
          [-0.2, 3.5],
          [0.9, 3.2],
          [1.5, 2.3],
          [1.5, 0.8],
          [0.8, -0.5],
          [0.3, -1.7],
          [-0.1, -3.1],
          [-1.1, -3.6],
          [-1.7, -2.8],
          [-1.7, -1.2],
          [-1.5, 0.5],
          [-0.9, 2.2],
        ],
      },
    ],

    color: GRASS_COLOR,

    wall: {
      color: WALL_COLOR,
      height: 0.65,
      thickness: 0.25,
    },
  },

  // ----------------------------------------------------------
  // SURFACE HAZARDS
  // ----------------------------------------------------------

  surfaces: [
    // Upper-right sand bunker
    surfaceBrick.patch({
      id: "upper-right-sand",
      surface: "sand",
      position: [2.6, 0, 6],
      size: [3, 3.8],
      color: SAND_COLOR,
    }),

    // Lower-left sand bunker
    surfaceBrick.patch({
      id: "lower-left-sand",
      surface: "sand",
      position: [-3.2, 0, -5.7],
      size: [3, 3],
      color: SAND_COLOR,
    }),
  ],

  // ----------------------------------------------------------
  // TERRAIN
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: -0.15,
  },

  // ----------------------------------------------------------
  // DEVELOPMENT VALIDATION
  // ----------------------------------------------------------

  validate: import.meta.env.DEV,
});

export default course02;
