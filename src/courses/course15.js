// src/courses/course15.js

import { createCourseShape } from "./courseBuilder";
import { deformation } from "./terrainPresets";
import { createLoopPath } from "../terrain/loopTrack.js";

// ============================================================
// COURSE 15 — HILL LOOP 2
// ============================================================

const GRASS_COLOR = "#328b50";
const HILL_COLOR = "#638b4d";
const WALL_COLOR = "#806d55";
const TRACK_COLOR = "#a87945";

// ============================================================
// DOUBLE HORIZONTAL LOOP
// ============================================================

const LOOP = {
  id: "double-horizontal",
  type: "horizontalLoop",

  position: [0, 0, 0],
  rotation: [0, 0, 0],

  loops: 2,

  radius: 3,
  width: 1.2,

  loopSpacing: 4.8,
  betweenLength: 1.5,

  approachLength: 3,
  departureLength: 4,

  autoOverpass: true,
  overpassHeight: 1.7,
  overpassRampLength: 4,

  segmentsPerLoop: 128,

  rails: true,
  railHeight: 0.35,

  color: TRACK_COLOR,
  railColor: "#806044",

  friction: 0.55,
  restitution: 0.05,
};

// ============================================================
// TRACK CENTRELINE
// ============================================================

// Use the EXACT same centreline generator as
// LoopObstacle.jsx, keeping floor and track aligned.

const centerline = createLoopPath(
  LOOP,
  "horizontalLoop"
);

// Convert local positions to world X/Z positions.
// Course 15 uses zero rotation for its loop.

const toXZ = (point) => [
  point.x + LOOP.position[0],
  point.z + LOOP.position[2],
];

// Use fewer samples for the underlying floor.
// The physical track retains full detail.

const TRACK_POINTS = centerline
  .filter(
    (_, index) =>
      index % 4 === 0 ||
      index === centerline.length - 1
  )
  .map(toXZ);

// ============================================================
// ENTRANCE AND EXIT
// ============================================================

const first = centerline[0];
const second = centerline[1];

const last = centerline.at(-1);
const beforeLast = centerline.at(-2);

const entryDirection = second
  .clone()
  .sub(first)
  .setY(0)
  .normalize();

const exitDirection = last
  .clone()
  .sub(beforeLast)
  .setY(0)
  .normalize();

const ENTRY = toXZ(first);
const EXIT = toXZ(last);

// Extend the starting fairway along the
// entrance tangent.

const START = [
  ENTRY[0] - entryDirection.x * 2.6,
  ENTRY[1] - entryDirection.z * 2.6,
];

// Extend the exit fairway toward the hole.

const HOLE = [
  EXIT[0] + exitDirection.x * 3,
  EXIT[1] + exitDirection.z * 3,
];

// ============================================================
// CENTRAL HILL
// ============================================================

// Repositioned inside the first loop.
// Kept clear of the track and its rails.

const HILL = {
  x: 6.6,
  z: 0.8,
  radius: 1.1,
  height: 1.65,
};

// ============================================================
// COURSE SHAPE
// ============================================================

const shape = createCourseShape({
  type: "compound",

  parts: [
    // Starting fairway
    {
      type: "path",
      curved: false,
      points: [
        START,
        ENTRY,
      ],
      width: 2.6,
    },

    // Floor beneath both physical loops
    {
      type: "path",
      curved: false,
      points: TRACK_POINTS,
      width: LOOP.width + 0.6,
    },

    // Exit fairway
    {
      type: "path",
      curved: false,
      points: [
        EXIT,
        HOLE,
      ],
      width: 2.4,
    },

    // Final putting green
    {
      type: "circle",
      x: HOLE[0],
      z: HOLE[1],
      radius: 2,
    },
  ],

  // Prevent overlapping floor colliders
  // wherever the hill meets the fairway.
  cutouts: [
    {
      type: "circle",
      x: HILL.x,
      z: HILL.z,
      radius: HILL.radius,
    },
  ],

  color: GRASS_COLOR,

  wall: {
    color: WALL_COLOR,
    height: 0.55,
    thickness: 0.25,
  },
});

// ============================================================
// HILL FLOOR
// ============================================================

const hillShape = createCourseShape({
  type: "circle",

  x: HILL.x,
  z: HILL.z,
  radius: HILL.radius,

  color: HILL_COLOR,
  friction: 0.95,
});

// ============================================================
// COURSE DEFINITION
// ============================================================

const course15 = {
  id: "course-15",
  number: 15,
  name: "Hill Loop 2",
  environment: "garden",
  par: 4,

  ballStart: [
    START[0],
    0.25,
    START[1],
  ],

  hole: {
    position: [
      HOLE[0],
      0,
      HOLE[1],
    ],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Playable geometry
  // ----------------------------------------------------------

  sections: [
    ...shape.sections,

    ...hillShape.sections.map((section, index) => ({
      ...section,
      id: `central-hill-${index}`,
      terrainMaxEdge: 0.2,
    })),
  ],

  // ----------------------------------------------------------
  // Boundaries
  // ----------------------------------------------------------

  // Use exterior rings only, avoiding an
  // unnecessary boundary around the hill.

  boundaryRings: shape.sections.flatMap(
    (section) =>
      (section.polygons ?? []).map(
        (polygon) => polygon[0]
      )
  ),

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
  // Physical double horizontal loop
  // ----------------------------------------------------------

  obstacles: [
    LOOP,
  ],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 36,
    length: 40,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [
      deformation({
        position: [HILL.x, HILL.z],

        radiusX: HILL.radius,
        radiusZ: HILL.radius,

        height: HILL.height,
        falloff: 0.7,

        blend: "max",
      }),
    ],
  },
};

export default course15;
