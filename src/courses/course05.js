// src/courses/course05.js


import { createLayoutCourse } from "./layoutCourse.js";
import { terrainBrick } from "./terrainBricks.js";

import {
  brick,
  assembly,
} from "./bricks.js";

// ============================================================
// COURSE 05 — CAVERN
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";
const ROCK_COLOR = "#82796b";

// ============================================================
// CAVERN DIMENSIONS
// ============================================================

const CAVERN_WIDTH = 6;
const CAVERN_HEIGHT = 3.6;
const CAVERN_LENGTH = 6.5;

const OPENING_WIDTH = 1.9;
const OPENING_HEIGHT = 1.7;

// Each wall occupies the space outside
// the central opening.
const SIDE_WIDTH =
  (CAVERN_WIDTH - OPENING_WIDTH) / 2;

const SIDE_X =
  OPENING_WIDTH / 2 + SIDE_WIDTH / 2;

// Extend walls slightly below the ground
// to accommodate the shallow valley.
const WALL_DEPTH = 0.35;

const SIDE_HEIGHT =
  OPENING_HEIGHT + WALL_DEPTH;

const SIDE_Y =
  (OPENING_HEIGHT - WALL_DEPTH) / 2;

// Roof begins exactly at the opening height.
const ROOF_HEIGHT =
  CAVERN_HEIGHT - OPENING_HEIGHT;

const ROOF_Y =
  OPENING_HEIGHT + ROOF_HEIGHT / 2;

// ============================================================
// COURSE DEFINITION
// ============================================================

const course05 = createLayoutCourse({
  id: "course-05",
  number: 5,
  name: "Cavern",
  environment: "garden",
  par: 3,

  // ----------------------------------------------------------
  // START AND HOLE
  // ----------------------------------------------------------

  ballStart: [-1.25, 0.25, 9],

  hole: {
    position: [1.5, 0, -9],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // PLAYABLE COURSE SHAPE
  // ----------------------------------------------------------

  shape: {
    type: "rounded",

    points: [
      [-3.5, -11],
      [3.5, -11],
      [4.8, -9],
      [5.8, -6],
      [6.5, -3],
      [6.8, 0],
      [6.5, 3],
      [5.8, 6],
      [4.8, 9],
      [3.5, 11],
      [-3.5, 11],
      [-4.5, 9],
      [-5, 5],
      [-5.2, 0],
      [-5, -5],
      [-4.5, -9],
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
  // TERRAIN
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
  },

  // ----------------------------------------------------------
  // TERRAIN GEOGRAPHY
  // ----------------------------------------------------------

  geography: {
    features: [
      // Shallow depression through the cavern
      terrainBrick.valley({
        position: [0, 0],
        radius: 4.8,
        depth: 0.25,
        blend: "add",
      }),

      // Right-hand approach
      terrainBrick.hill({
        position: [4.5, 3.5],
        radius: 2.3,
        height: 0.45,
      }),

      // Right-hand exit
      terrainBrick.hill({
        position: [4.5, -3.5],
        radius: 2.4,
        height: 0.35,
      }),

      // Narrow left-hand route
      terrainBrick.hill({
        position: [-4.2, 0],
        radius: 1.7,
        height: 0.3,
      }),

      // Final approach
      terrainBrick.hill({
        position: [-2.7, -6.2],
        radius: 1.9,
        height: 0.3,
      }),
    ],
  },

  // ----------------------------------------------------------
  // BRICK ASSEMBLY — CAVERN
  // ----------------------------------------------------------

  obstacles: [
    assembly({
      id: "main-cavern",

      position: [0, 0, 0],
      rotation: [0, 0, 0],

      friction: 0.85,
      restitution: 0.2,
      terrainAlign: false,

      parts: [
        // Left rock wall
        brick.box(
          [
            SIDE_WIDTH,
            SIDE_HEIGHT,
            CAVERN_LENGTH,
          ],
          [
            -SIDE_X,
            SIDE_Y,
            0,
          ],
          {
            id: "left-wall",
            color: ROCK_COLOR,
            roughness: 1,
          }
        ),

        // Right rock wall
        brick.box(
          [
            SIDE_WIDTH,
            SIDE_HEIGHT,
            CAVERN_LENGTH,
          ],
          [
            SIDE_X,
            SIDE_Y,
            0,
          ],
          {
            id: "right-wall",
            color: ROCK_COLOR,
            roughness: 1,
          }
        ),

        // Rock ceiling
        brick.box(
          [
            CAVERN_WIDTH,
            ROOF_HEIGHT,
            CAVERN_LENGTH,
          ],
          [
            0,
            ROOF_Y,
            0,
          ],
          {
            id: "roof",
            color: "#71695f",
            roughness: 1,
          }
        ),
      ],
    }),
  ],

  // ----------------------------------------------------------
  // DEVELOPMENT VALIDATION
  // ----------------------------------------------------------

  validate: import.meta.env.DEV,
});

export default course05;
