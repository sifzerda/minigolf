// src/courses/course08.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";

// ============================================================
// COURSE 08 — BUSH BEND
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#806d55";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
    // Left starting area
    [-7.2, -1.2],
    [-6.0, -1.9],
    [-4.7, -1.2],

    // Narrow inward curve
    [-3.6, 1.2],
    [-3.1, 3.2],
    [-1.8, 4.0],
    [0.9, 3.9],

    // Inner edge of right-hand curve
    [3.0, 2.6],
    [4.0, 0.5],
    [4.7, -2.5],
    [5.3, -5.4],

    // Narrow upper-right end
    [5.0, -8.7],
    [5.0, -9.7],
    [6.7, -10.1],
    [8.0, -8.9],
    [8.3, -6.6],

    // Outer right boundary
    [8.6, -2.0],
    [8.4, 2.5],
    [7.7, 5.8],
    [6.4, 7.7],

    // Long lower curve
    [3.5, 9.0],
    [-1.0, 9.5],
    [-5.4, 9.3],

    // Rounded left end
    [-7.6, 8.4],
    [-8.3, 5.9],
    [-8.4, 2.7],
    [-8.0, 0.0],
  ],
  0.45,
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
// BUSH HELPER
// ============================================================

function bush(
  id,
  x,
  z,
  radiusX,
  radiusZ,
  mode = "slow",
  count = 12
) {
  return {
    id,
    type: "bushPatch",
    position: [x, 0, z],

    radiusX,
    radiusZ,

    mode,
    count,

    // Fixed seed for repeatable vegetation.
    seed: id.split("").reduce(
      (value, char) => value * 31 + char.charCodeAt(0),
      1
    ) >>> 0,

    drag: 3.5,

    color: mode === "solid"
      ? "#245f32"
      : "#397e3e",
  };
}

// ============================================================
// COURSE DEFINITION
// ============================================================

const course08 = {
  ...shape,

  id: "course-08",
  number: 8,
  name: "Bush Bend",
  environment: "garden",
  par: 4,

  ballStart: [-6.8, 0.25, 0.7],

  hole: {
    position: [6.1, 0, -8.6],
    radius: 0.43,
  },

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
  // Vegetation
  // ----------------------------------------------------------

  obstacles: [
    // Dense bushes on the lower-left.
    bush(
      "left-dense-bushes",
      -6.0, 6.4,
      1.15, 1.25,
      "solid", 9
    ),

    // Slower grass beside the dense bushes.
    bush(
      "left-soft-bushes",
      -4.4, 7.25,
      1.3, 1.0,
      "slow", 12
    ),

    // Bushes along the bottom curve.
    bush(
      "bottom-soft-bushes",
      1.7, 7.2,
      1.9, 0.9,
      "slow", 14
    ),

    // Dense vegetation inside the right turn.
    bush(
      "right-dense-bushes",
      5.9, -0.1,
      0.6, 1.6,
      "solid", 8
    ),

    // Soft bushes approaching the final stretch.
    bush(
      "right-soft-bushes",
      6.1, -3.9,
      0.85, 1.3,
      "slow", 10
    ),
  ],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 36,
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [],
  },
};

export default course08;
