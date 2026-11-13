// src/courses/course04.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";
import { hill, valley, deformation } from "./terrainPresets";

// ============================================================
// COURSE 04 — ROLLING HILLS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
    [-3.2, -10],
    [3.2, -10],
    [4.5, -8.5],
    [4.5, 8.5],
    [3.2, 10],
    [-3.2, 10],
    [-4.5, 8.5],
    [-4.5, -8.5],
  ],
  0.8,
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

const course04 = {
  ...shape,

  id: "course-04",
  number: 4,
  name: "Rolling Hills",
  environment: "garden",
  par: 3,

  ballStart: [0, 0.25, 8.5],

  hole: {
    position: [0, 0, -8.5],
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
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 24,
    length: 32,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",

    features: [
      // First hill
      deformation({
        position: [0, 4.5],
        radiusX: 3.4,
        radiusZ: 2.6,
        height: 0.7,
        blend: "add",
      }),

      // Central raised terrain
      deformation({
        position: [0, -3],
        radiusX: 3.8,
        radiusZ: 2.8,
        height: 1,
        blend: "max",
      }),

      // Shallow valley
      valley({
        position: [0, 0.5],
        radius: 2.2,
        depth: 0.2,
        blend: "add",
      }),

      // Taller overlapping hill
      deformation({
        position: [0, -3],
        radiusX: 3.8,
        radiusZ: 2.8,
        height: 1,
        falloff: 1.4,
      }),

      // Small hill near the hole
      hill({
        position: [2.3, -5.8],
        radius: 1.8,
        height: 0.35,
      }),
    ],
  },
};

export default course04;
