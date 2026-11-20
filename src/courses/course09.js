// src/courses/course09.js

import { createCourseShape } from "./courseBuilder";
import { deformation } from "./terrainPresets";

// ============================================================
// COURSE 09 — HILL LOOP
// ============================================================

const GRASS_COLOR = "#328b50";
const HILL_COLOR = "#547d42";
const WALL_COLOR = "#806d55";

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function ellipsePoints(
  x,
  z,
  radiusX,
  radiusZ,
  segments = 48
) {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;

    return [
      x + Math.cos(angle) * radiusX,
      z + Math.sin(angle) * radiusZ,
    ];
  });
}

// ============================================================
// COURSE GEOMETRY
// ============================================================

// Large circular loop.
const LOOP_OUTER = ellipsePoints(
  2.6, -4.6,
  4.4, 4.6
);

// Central hill footprint.
// Creates a ring-shaped fairway around the hill.
const HILL_INNER = ellipsePoints(
  2.6, -4.6,
  2.5, 2.75
);

// The compound shape joins the starting fairway,
// circular loop and final green into one course.
const shape = createCourseShape({
  type: "compound",

  parts: [
    // Straight starting fairway.
    {
      type: "path",
      curved: true,
      points: [
        [0, 10.5],
        [-0.1, 7.5],
        [0, 4.5],
        [0.2, 2],
        [0.1, 0],
      ],
      width: 2.6,
    },

    // Large loop around the hill.
    {
      type: "polygon",
      points: LOOP_OUTER,
    },

    // Curved connection from the loop
    // to the final green.
    {
      type: "path",
      curved: true,
      points: [
        [-1.4, -7.2],
        [-2.6, -7.6],
        [-3.8, -6.4],
      ],
      width: 2.2,
    },

    // Rounded putting green.
    {
      type: "circle",
      x: -4.2,
      z: -6.4,
      radius: 2.3,
    },
  ],

  // Remove the central hill footprint
  // to produce an actual loop-shaped fairway.
  cutouts: [
    {
      type: "polygon",
      points: HILL_INNER,
    },
  ],

  color: GRASS_COLOR,

  wall: {
    color: WALL_COLOR,
    height: 0.65,
    thickness: 0.25,
  },
});

// ============================================================
// CENTRAL HILL
// ============================================================

// Separate floor section fills the centre of the loop.
// The terrain deformation raises this into a hill.
const hillShape = createCourseShape({
  type: "polygon",
  points: HILL_INNER,
  color: HILL_COLOR,
  friction: 0.95,
});

// ============================================================
// COURSE DEFINITION
// ============================================================

const course09 = {
  id: "course-09",
  number: 9,
  name: "Hill Loop",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 10.5],

  hole: {
    position: [-4.2, 0, -6.4],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Playable geometry
  // ----------------------------------------------------------

  sections: [
    ...shape.sections,

    // Raised hill inside the circular fairway.
    ...hillShape.sections.map((section, index) => ({
      ...section,
      id: `central-hill-${index}`,
      terrainMaxEdge: 0.2,
    })),
  ],

  // ----------------------------------------------------------
  // Course boundaries
  // ----------------------------------------------------------

  // Includes both the exterior boundary
  // and the interior wall around the hill.
  boundaryRings: shape.boundaryRings,

  wallStyle: {
    color: WALL_COLOR,
    height: 0.65,
    thickness: 0.25,
    friction: 0.85,
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
    width: 30,
    length: 40,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [
      // Large rounded central hill.
      deformation({
        position: [2.6, -4.6],

        radiusX: 2.5,
        radiusZ: 2.75,

        height: 3.2,
        falloff: 1,

        blend: "max",
      }),
    ],
  },
};

export default course09;
