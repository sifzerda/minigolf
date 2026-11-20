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
// MYSTERY EXITS
// ============================================================

// The CavernRenderer shuffles a one-to-one mapping
// between these destinations once per session.
// Exit positions are WORLD coordinates.

const EXITS = [
  {
    position: [-3.4, 0.25, -7],
    velocity: [0, 0, -1.2],
  },

  // Winning destination — directly above the cup.
  {
    position: [0, 0.38, -9.4],
    velocity: [0, -0.3, 0],
  },

  {
    position: [3.4, 0.25, -7],
    velocity: [0, 0, -1.2],
  },
];

// ============================================================
// ONE SOLID MASS WITH THREE TUNNELS
// ============================================================

const TUNNEL_X = [-3.2, 0, 3.2];

const MYSTERY_CAVERNS = {
  id: "course-06-mystery-caverns",
  type: "cavern",

  position: [0, 0, 0],
  rotation: [0, 0, 0],

  // One solid rectangular structure.
  mass: {
    shape: "box",
    size: [11, 3.5, 5],
  },

  // Carve three passages through the mass.
  tunnels: TUNNEL_X.map((x, entranceIndex) => ({
    id: `mystery-passage-${entranceIndex + 1}`,

    shape: "round",
    radius: 0.85,
    segments: 24,

    // Tunnel coordinates are local to the mass.
    // Extend beyond both faces for complete openings.
    from: [x, 0.8, 3.5],
    to: [x, 0.8, -3.5],

    // Mystery teleport functionality.
    portal: {
      group: "course-06-mystery",
      entranceIndex,

      exits: EXITS,

      // Sensor just inside the entrance.
      sensorPosition: [x, 0.8, 1.8],
      sensorRadius: 0.55,

      // Activate only when entering the tunnel.
      requireForward: true,
    },
  })),

  color: ROCK_COLOR,
  friction: 0.85,
  restitution: 0.15,
};

// ============================================================
// COURSE DEFINITION
// ============================================================

const course06 = {
  ...shape,

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
  // Obstacles
  // ----------------------------------------------------------

  obstacles: [
    MYSTERY_CAVERNS,
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
