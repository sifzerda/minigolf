// src/courses/course03.js

import { createLayoutCourse } from "./layoutCourse.js";

import {
  brick,
  assembly,
} from "./bricks.js";

// ============================================================
// COURSE 03 — LAKE ISLAND
// ============================================================

const GRASS_COLOR = "#328b50";
const SHORE_COLOR = "#806d55";
const BRIDGE_COLOR = "#a87945";
const WATER_COLOR = "#1479a8";
const BASIN_COLOR = "#52636a";

// ============================================================
// COURSE GEOGRAPHY
// ============================================================

// Outer playable boundary.
const OUTER = [
  [-4.0, -10.0],
  [4.0, -10.0],
  [5.0, -9.0],
  [5.0, 9.0],
  [4.0, 10.0],
  [-4.0, 10.0],
  [-5.0, 9.0],
  [-5.0, -9.0],
];

// Lake footprint.
const LAKE = [
  [-2.8, -5.5],
  [-3.8, -4.6],
  [-4.1, -2.5],
  [-4.1, 2.5],
  [-3.8, 4.6],
  [-2.8, 5.5],
  [2.8, 5.5],
  [3.8, 4.6],
  [4.1, 2.5],
  [4.1, -2.5],
  [3.8, -4.6],
  [2.8, -5.5],
];

// Central playable island.
const ISLAND = [
  [-0.8, -3.1],
  [-1.2, -2.4],
  [-1.3, -0.8],
  [-1.3, 0.8],
  [-1.2, 2.4],
  [-0.8, 3.1],
  [0.8, 3.1],
  [1.2, 2.4],
  [1.3, 0.8],
  [1.3, -0.8],
  [1.2, -2.4],
  [0.8, -3.1],
];

// ============================================================
// BRIDGE DIMENSIONS
// ============================================================

const BRIDGE_SIZE = [0.7, 0.2, 3];
const BRIDGE_Y = -BRIDGE_SIZE[1] / 2;

// ============================================================
// COURSE DEFINITION
// ============================================================

const course03 = createLayoutCourse({
  id: "course-03",
  number: 3,
  name: "Lake Island",
  environment: "garden",
  par: 4,

  // ----------------------------------------------------------
  // START AND HOLE
  // ----------------------------------------------------------

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // MAIN PLAYABLE FLOOR
  // ----------------------------------------------------------

  shape: {
    type: "rounded",
    points: OUTER,

    tolerance: 0.025,
    maxSegmentLength: 0.5,

    color: GRASS_COLOR,

    wall: {
      color: SHORE_COLOR,
      height: 0.65,
      thickness: 0.25,
      friction: 0.8,
      restitution: 0.35,
    },
  },

  // ----------------------------------------------------------
  // ADDITIONAL PLAYABLE FLOOR — ISLAND
  // ----------------------------------------------------------

  sections: [
    {
      id: "island",
      type: "floor",

      points: ISLAND,

      y: 0,
      color: GRASS_COLOR,
      friction: 0.85,

      // Prevent lake cutout logic from
      // removing the central island.
      excludeWater: true,
    },
  ],

  // ----------------------------------------------------------
  // WATER HAZARD
  // ----------------------------------------------------------

  surfaces: [
    {
      id: "lake-water",
      surface: "water",

      position: [0, 0, 0],

      points: LAKE,
      holes: [ISLAND],

      depth: 0.65,

      color: WATER_COLOR,
      basinColor: BASIN_COLOR,

      respawnPosition: [0, 0.5, 8],
    },
  ],

  // ----------------------------------------------------------
  // BRICK ASSEMBLIES — BRIDGES
  // ----------------------------------------------------------

  obstacles: [
    // Bridge from starting area to island.
    assembly({
      id: "bridge-start-island",

      position: [0, BRIDGE_Y, 4.3],
      rotation: [0, 0, 0],

      friction: 0.9,
      restitution: 0,
      terrainAlign: false,

      parts: [
        brick.box(
          BRIDGE_SIZE,
          [0, 0, 0],
          {
            id: "deck",
            color: BRIDGE_COLOR,
            roughness: 0.8,
            metalness: 0.05,
          }
        ),
      ],
    }),

    // Bridge from island to target area.
    assembly({
      id: "bridge-island-hole",

      position: [0, BRIDGE_Y, -4.3],
      rotation: [0, 0, 0],

      friction: 0.9,
      restitution: 0,
      terrainAlign: false,

      parts: [
        brick.box(
          BRIDGE_SIZE,
          [0, 0, 0],
          {
            id: "deck",
            color: BRIDGE_COLOR,
            roughness: 0.8,
            metalness: 0.05,
          }
        ),
      ],
    }),
  ],

  // ----------------------------------------------------------
  // TERRAIN
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",
  },

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  validate: import.meta.env.DEV,
});

export default course03;
