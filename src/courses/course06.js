// src/courses/course06.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";

// ============================================================
// COURSE 06 — MYSTERY TUNNELS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";
const BOX_COLOR = "#99968d";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
    [-4, -11],
    [4, -11],
    [5, -10],
    [5, 10],
    [4, 11],
    [-4, 11],
    [-5, 10],
    [-5, -10],
  ],
  0.8,
  6
);

const shape = createCourseShape({
  type: "polygon",
  points: OUTER,
  color: GRASS_COLOR,
});

// ============================================================
// COURSE DEFINITION
// ============================================================

const course06 = {
  ...shape,

  id: "course-06",
  number: 6,
  name: "Mystery Tunnels",
  environment: "garden",
  par: 2,

  ballStart: [0, 0.25, 9],

  hole: {
    position: [0, 0, -4.2],
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
  ramps: [],

  // ----------------------------------------------------------
  // Mystery tunnel box
  // ----------------------------------------------------------

  obstacles: [
    {
      id: "mystery-tunnels",
      type: "mysteryTunnels",

      position: [0, 0, 0],

      size: [10, 2.4, 7],

      openingWidth: 1.35,
      openingHeight: 1.15,

      color: BOX_COLOR,

      friction: 0.8,
      restitution: 0.25,

      exits: [
        // Left exit
        {
          position: [-3, 0.26, -3.8],
          velocity: [0, 0, -2.5],
        },

        // Centre exit — directly into the cup
        {
          position: [0, 0.28, -4.2],
          velocity: [0, -0.35, 0],
        },

        // Right exit
        {
          position: [3, 0.26, -3.8],
          velocity: [0, 0, -2.5],
        },
      ],
    },
  ],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [],
  },
};

export default course06;
