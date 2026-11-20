// src/courses/course06.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";

// ============================================================
// COURSE 06 — MYSTERY CAVERNS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#806d55";
const ROCK_COLOR = "#82796b";

// ============================================================
// COURSE GEOMETRY
// ============================================================

const OUTER = roundedPolygon(
  [
    [-5, -12],
    [5, -12],
    [6, -11],
    [6, 11],
    [5, 12],
    [-5, 12],
    [-6, 11],
    [-6, -11],
  ],
  0.6,
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
// HIDDEN EXIT DESTINATIONS
// ============================================================

// One of these destinations leads straight
// into the golf cup.
//
// The entrances are randomly assigned to
// these exits each course session.

const EXITS = [
  // Left destination
  {
    position: [-3.4, 0.25, -7],
    velocity: [0, 0, -1.2],
  },

  // Winning destination
  {
    position: [0, 0.38, -9.4],
    velocity: [0, -0.3, 0],
  },

  // Right destination
  {
    position: [3.4, 0.25, -7],
    velocity: [0, 0, -1.2],
  },
];

// ============================================================
// CAVERN HELPER
// ============================================================

function createMysteryCavern(index, x) {
  return {
    id: `mystery-cavern-${index + 1}`,
    type: "cavern",

    position: [x, 0, 0],
    rotation: [0, 0, 0],

    size: [2.9, 2.45, 5],

    openingWidth: 1.4,
    openingHeight: 1.1,

    segments: 16,
    rings: 6,
    seed: 106 + index,

    color: ROCK_COLOR,
    friction: 0.85,
    restitution: 0.15,

    // Optional behaviour supported by
    // the updated CavernRenderer.
    portal: {
      group: "course-06-mystery",
      entranceIndex: index,
      exits: EXITS,
    },
  };
}

// ============================================================
// COURSE DEFINITION
// ============================================================

const course06 = {
  id: "course-06",
  number: 6,
  name: "Mystery Caverns",
  environment: "garden",
  par: 2,

  ballStart: [0, 0.25, 9.5],

  hole: {
    position: [0, 0, -9.4],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Playable floor
  // ----------------------------------------------------------

  ...shape,

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
  // Three cavern openings inside a large box
  // ----------------------------------------------------------

  obstacles: [
    // Main rectangular roof
    {
      id: "cavern-roof",
      type: "block",

      position: [0, 3.15, 0],
      size: [11, 1.1, 5.2],

      color: ROCK_COLOR,
    },

    // Left end support
    {
      id: "cavern-left-support",
      type: "block",

      position: [-5.1, 1.3, 0],
      size: [0.8, 2.6, 5.2],

      color: ROCK_COLOR,
    },

    // Right end support
    {
      id: "cavern-right-support",
      type: "block",

      position: [5.1, 1.3, 0],
      size: [0.8, 2.6, 5.2],

      color: ROCK_COLOR,
    },

    // Three independent cavern passages.
    createMysteryCavern(0, -3.1),
    createMysteryCavern(1, 0),
    createMysteryCavern(2, 3.1),
  ],

  // ----------------------------------------------------------
  // Flat terrain
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
