// src/courses/course01.js

import { createLayoutCourse } from "./layoutCourse.js";
import { terrainBrick } from "./terrainBricks.js";

// ============================================================
// COURSE 01 — SMALL HILL
// ============================================================

const GRASS_COLOR = "#328b50";

const course01 = createLayoutCourse({
  id: "course-01",
  number: 1,
  name: "Small Hill",
  environment: "garden",
  par: 2,

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

    tolerance: 0.025,
    maxSegmentLength: 0.5,
    color: GRASS_COLOR,
  },

  // ----------------------------------------------------------
  // TERRAIN CONFIGURATION
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: -0.15,
    color: GRASS_COLOR,
  },

  // ----------------------------------------------------------
  // NATURAL GEOGRAPHY
  // ----------------------------------------------------------

  geography: {
    features: [
      terrainBrick.ridge({
        start: [-4, 0],
        end: [4, 0],
        width: 4,
        height: 0.9,
      }),
    ],
  },

  // ----------------------------------------------------------
  // DEVELOPMENT VALIDATION
  // ----------------------------------------------------------

  validate: import.meta.env.DEV,
});

export default course01;
