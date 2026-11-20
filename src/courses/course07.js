// src/courses/course07.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";
import { ridge } from "./terrainPresets";

// ============================================================
// COURSE 07 — TWIN HILLS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
    // Starting area
    [1.6, 10],
    [1.9, 8],

    // First hill
    [2.8, 6.3],
    [3.3, 5.1],
    [2.4, 4],

    // Narrow middle section
    [1.8, 2.7],
    [1.8, 0.2],

    // Second hill
    [2.3, -1.6],
    [3.1, -2.7],
    [2.8, -3.6],

    // Wide area around the hole
    [2.2, -4.9],
    [2.2, -7.7],
    [1.5, -9.7],
    [0.3, -10.1],
    [-1.6, -10.1],
    [-2.8, -9.4],
    [-3.3, -8],
    [-3.4, -6],

    // Lower boundary — second hill
    [-3, -4.9],
    [-2, -3.7],
    [-0.9, -2.7],

    // Narrow middle section
    [-0.9, -1.8],
    [-1.4, -0.1],
    [-1.4, 2.5],

    // Lower boundary — first hill
    [-1, 4],
    [-0.7, 5],
    [-1.8, 6.1],

    // Back to starting area
    [-2.4, 7.6],
    [-2.4, 9.6],
    [-1.7, 10.1],
  ],
  0.5,
  5
);

const shape = createCourseShape({
  type: "polygon",
  points: OUTER,
  color: GRASS_COLOR,

  wall: {
    color: WALL_COLOR,
    height: 0.55,
    thickness: 0.25,
  },
});

// ============================================================
// COURSE DEFINITION
// ============================================================

const course07 = {
  ...shape,

  id: "course-07",
  number: 7,
  name: "Twin Hills",
  environment: "garden",
  par: 3,

  ballStart: [0, 0.25, 9],

  hole: {
    position: [-0.1, 0, -8.4],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Boundaries
  // ----------------------------------------------------------

  boundaryRings: [OUTER],

  wallStyle: {
    color: WALL_COLOR,
    height: 0.55,
    thickness: 0.25,
    friction: 0.8,
    restitution: 0.3,
  },

  walls: [],
  surfaces: [],
  obstacles: [],
  ramps: [],

  // ----------------------------------------------------------
  // Terrain — two hills
  // ----------------------------------------------------------

  terrain: {
    width: 24,
    length: 32,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [
      // First hill — moderately steep
      ridge({
        start: [-4, 5],
        end: [4, 5],
        width: 4.6,
        height: 1.0,
      }),

      // Second hill — slightly taller
      ridge({
        start: [-4, -2.7],
        end: [4, -2.7],
        width: 4.8,
        height: 2.5,
        blend: "max",
      }),
    ],
  },
};

export default course07;
