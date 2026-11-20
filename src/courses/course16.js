// src/courses/course16.js

import { createCourseShape } from "./courseBuilder";
import { createLoopPath } from "../terrain/loopTrack.js";

// ============================================================
// COURSE 16 — SKYWARD LOOP
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#806d55";
const TRACK_COLOR = "#d6a34b";

// ============================================================
// VERTICAL LOOP
// ============================================================

const LOOP = {
  id: "course-16-diagonal-vertical-loop",
  type: "verticalLoop",

  position: [-0.9, 0, 0],
  rotation: [0, 0, 0],

  loops: 1,

  radius: 3.0,
  width: 1.5,

  verticalAdvance: "forward",
  loopSpacing: 4.1,
  verticalLateralOffset: 3.0,
  betweenLength: 0,

  approachLength: 3.4,
  departureLength: 3.8,

  groundY: 0.04,
  segmentsPerLoop: 128,

  rails: true,
  railHeight: 0.38,

  color: TRACK_COLOR,
  railColor: "#846036",

  friction: 0.55,
  restitution: 0.04,
};

// ============================================================
// GENERATE BOUNDARY FROM LOOP PATH
// ============================================================

const track = createLoopPath(LOOP, "verticalLoop");

// Convert local track coordinates to world X/Z.
// Rotation is zero for this course.
const toXZ = (point) => [
  point.x + LOOP.position[0],
  point.z + LOOP.position[2],
];

const first = track[0];
const second = track[1];

const last = track.at(-1);
const penultimate = track.at(-2);

function horizontalDirection(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;

  const length = Math.hypot(dx, dz) || 1;

  return [dx / length, dz / length];
}

const [entryDX, entryDZ] = horizontalDirection(
  first,
  second
);

const [exitDX, exitDZ] = horizontalDirection(
  penultimate,
  last
);

const ENTRY = toXZ(first);
const EXIT = toXZ(last);

// Straight run-up aligned with the loop entrance.
const START = [
  ENTRY[0] - entryDX * 4.7,
  ENTRY[1] - entryDZ * 4.7,
];

// Putting green aligned with the loop exit.
const CUP = [
  EXIT[0] + exitDX * 3.4,
  EXIT[1] + exitDZ * 3.4,
];

// Sample the track for its ground footprint.
// The actual loop renderer retains its full detail.
const TRACK_POINTS = track
  .filter(
    (_, index) =>
      index % 5 === 0 ||
      index === track.length - 1
  )
  .map(toXZ);

// ============================================================
// BOUNDARY CLEARANCE
// ============================================================

// Extra distance between the track edges
// and the surrounding course walls.
const LOOP_WALL_CLEARANCE = 1.4;

const LOOP_GROUND_WIDTH =
  LOOP.width + LOOP_WALL_CLEARANCE * 2;

// ============================================================
// COURSE SHAPE
// ============================================================

const shape = createCourseShape({
  type: "compound",

  parts: [
    // Rounded starting area
    {
      type: "circle",
      x: START[0],
      z: START[1],
      radius: 2.6,
    },

    // Approach fairway
    {
      type: "path",
      points: [START, ENTRY],
      width: 3.4,
    },

    // Main course outline follows the loop.
    {
      type: "path",
      points: TRACK_POINTS,
      width: LOOP_GROUND_WIDTH,
      roundJoins: true,
    },

    // Exit fairway
    {
      type: "path",
      points: [EXIT, CUP],
      width: 3.4,
    },

    // Rounded final green
    {
      type: "circle",
      x: CUP[0],
      z: CUP[1],
      radius: 2.7,
    },
  ],

  color: GRASS_COLOR,

  wall: {
    color: WALL_COLOR,
    height: 0.6,
    thickness: 0.25,
  },
});

// ============================================================
// EXTERIOR BOUNDARIES ONLY
// ============================================================

// The vertical loop can overlap its own footprint
// when viewed from above.
//
// Keep the exterior outline and fill any interior
// gaps with grass, so there are no unwanted walls
// beneath or inside the physical loop.

const outerPolygons = shape.sections[0].polygons.map(
  (polygon) => [polygon[0]]
);

// ============================================================
// TERRAIN DIMENSIONS
// ============================================================

const coords = [
  ...TRACK_POINTS,
  START,
  CUP,
];

const maxAbsX = Math.max(
  ...coords.map(([x]) => Math.abs(x))
);

const maxAbsZ = Math.max(
  ...coords.map(([, z]) => Math.abs(z))
);

// ============================================================
// COURSE DEFINITION
// ============================================================

const course16 = {
  ...shape,

  id: "course-16",
  number: 16,
  name: "Skyward Loop",
  environment: "garden",
  par: 4,

  ballStart: [
    START[0],
    0.25,
    START[1],
  ],

  hole: {
    position: [
      CUP[0],
      0,
      CUP[1],
    ],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Floor and boundaries
  // ----------------------------------------------------------

  sections: shape.sections.map((section) => ({
    ...section,
    polygons: outerPolygons,
  })),

  boundaryRings: outerPolygons.map(
    (polygon) => polygon[0]
  ),

  wallStyle: {
    color: WALL_COLOR,
    height: 0.6,
    thickness: 0.25,
    friction: 0.85,
    restitution: 0.25,
  },

  walls: [],
  surfaces: [],
  ramps: [],

  // ----------------------------------------------------------
  // Physical vertical loop
  // ----------------------------------------------------------

  obstacles: [
    LOOP,
  ],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: Math.ceil(maxAbsX * 2 + 12),
    length: Math.ceil(maxAbsZ * 2 + 12),
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [],
  },
};

export default course16;
