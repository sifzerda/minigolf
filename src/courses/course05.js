// src/courses/course05.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";
import { hill, valley } from "./terrainPresets";

// ============================================================
// COURSE 05 — CAVERN RUN
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";
const ROCK_COLOR = "#82796b";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
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
  0.9,
  6
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

const course05 = {
  ...shape,

  id: "course-05",
  number: 5,
  name: "Cavern",
  environment: "garden",
  par: 3,

  ballStart: [-1.25, 0.25, 9],

  hole: {
    position: [1.5, 0, -9],
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
  // Cavern
  // ----------------------------------------------------------

  obstacles: [
    {
      id: "main-cavern",
      type: "cavern",

      position: [0, 0, 0],
      rotation: [0, 0, 0],

      size: [6, 3.6, 6.5],

      openingWidth: 1.9,
      openingHeight: 1.7,

      segments: 12,
      rings: 6,
      seed: 105,

      color: ROCK_COLOR,
      friction: 0.85,
      restitution: 0.2,
    },
  ],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [
      // Shallow depression through the cavern
      valley({
        position: [0, 0],
        radius: 4.8,
        depth: 0.25,
        blend: "add",
      }),

      // Right-hand approach
      hill({
        position: [4.5, 3.5],
        radius: 2.3,
        height: 0.45,
      }),

      // Right-hand exit
      hill({
        position: [4.5, -3.5],
        radius: 2.4,
        height: 0.35,
      }),

      // Narrow left-hand route
      hill({
        position: [-4.2, 0],
        radius: 1.7,
        height: 0.3,
      }),

      // Final approach
      hill({
        position: [-2.7, -6.2],
        radius: 1.9,
        height: 0.3,
      }),
    ],
  },
};

export default course05;
