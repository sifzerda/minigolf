// src/courses/course04.js

import { createLayoutCourse } from "./layoutCourse.js";
import { terrainBrick } from "./terrainBricks.js";

// ============================================================
// COURSE 04 — ROLLING HILLS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";

// ============================================================
// COURSE DEFINITION
// ============================================================

const course04 = createLayoutCourse({
  id: "course-04",
  number: 4,
  name: "Rolling Hills",
  environment: "garden",
  par: 3,

  // ----------------------------------------------------------
  // START AND HOLE
  // ----------------------------------------------------------

  ballStart: [0, 0.25, 8.5],

  hole: {
    position: [0, 0, -8.5],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // PLAYABLE COURSE SHAPE
  // ----------------------------------------------------------

  shape: {
    type: "rounded",

    points: [
      [-3.2, -10],
      [3.2, -10],
      [4.5, -8.5],
      [4.5, 8.5],
      [3.2, 10],
      [-3.2, 10],
      [-4.5, 8.5],
      [-4.5, -8.5],
    ],

    tolerance: 0.025,
    maxSegmentLength: 0.5,

    color: GRASS_COLOR,

    wall: {
      color: WALL_COLOR,
      height: 0.55,
      thickness: 0.25,
      friction: 0.8,
      restitution: 0.3,
    },
  },

  // ----------------------------------------------------------
  // TERRAIN CONFIGURATION
  // ----------------------------------------------------------

  terrain: {
    width: 24,
    length: 32,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
  },

  // ----------------------------------------------------------
  // TERRAIN GEOGRAPHY
  // ----------------------------------------------------------

  geography: {
    features: [
      // 1. First elliptical hill
      {
        type: "deformation",

        position: [0, 4.5],

        radiusX: 3.4,
        radiusZ: 2.6,

        height: 0.7,
        blend: "add",
      },

      // 2. Central raised terrain
      {
        type: "deformation",

        position: [0, -3],

        radiusX: 3.8,
        radiusZ: 2.8,

        height: 1,
        blend: "max",
      },

      // 3. Shallow valley
      terrainBrick.valley({
        position: [0, 0.5],

        radius: 2.2,
        depth: 0.2,

        blend: "add",
      }),

      // 4. Taller overlapping hill
      {
        type: "deformation",

        position: [0, -3],

        radiusX: 3.8,
        radiusZ: 2.8,

        height: 1,
        falloff: 1.4,
      },

      // 5. Small hill near the hole
      terrainBrick.hill({
        position: [2.3, -5.8],

        radius: 1.8,
        height: 0.35,
      }),
    ],
  },

  // ----------------------------------------------------------
  // DEVELOPMENT VALIDATION
  // ----------------------------------------------------------

  validate: import.meta.env.DEV,
});

export default course04;
