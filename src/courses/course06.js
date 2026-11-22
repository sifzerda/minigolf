// src/courses/course06.js

import { createCourseShape } from "./courseBuilder.js";
import { brick, assembly } from "./bricks.js";

// ============================================================
// COURSE 06 — 3 TUNNELS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";
const ROCK_COLOR = "#82796b";
const FLOOR_COLOR = "#a87945";
const RAMP_COLOR = "#b8a58a";

const BALL_RADIUS = 0.25;

// ============================================================
// WIDE COURSE BOUNDARY
// ============================================================

// Large field with plenty of room for rolling terrain.

const FIELD_POINTS = [
  [-5, -12],
  [5, -12],
  [6, -11],
  [6, 11],
  [5, 12],
  [-5, 12],
  [-6, 11],
  [-6, -11],
];

// ============================================================
// TUNNEL CONFIGURATION
// ============================================================

const STRUCTURE_WIDTH = 11;
const STRUCTURE_LENGTH = 5;

const FLOOR_THICKNESS = 0.22;
const RAMP_LENGTH = 3.2;

const TUNNELS = [
  {
    id: "left",
    x: -3.2,
    diameter: 0.9,
    floorHeight: 0.7,
  },
  {
    id: "middle",
    x: 0,
    diameter: 0.8,
    floorHeight: 1.8,
  },
  {
    id: "right",
    x: 3.2,
    diameter: 0.9,
    floorHeight: 0.7,
  },
];

// ============================================================
// TUNNEL STRUCTURE HEIGHT
// ============================================================

const BASE_Y = -0.35;

const TOP_Y =
  Math.max(
    ...TUNNELS.map(
      (tunnel) =>
        tunnel.floorHeight +
        BALL_RADIUS +
        tunnel.diameter / 2
    )
  ) + 0.6;

const STRUCTURE_HEIGHT = TOP_Y - BASE_Y;

const STRUCTURE_Y =
  (BASE_Y + TOP_Y) / 2;

// ============================================================
// TUNNEL BRICK ASSEMBLY
// ============================================================

const tunnelStructure = assembly({
  id: "rolling-tunnel-structure",

  position: [0, 0, 0],
  rotation: [0, 0, 0],

  terrainAlign: false,

  friction: 0.85,
  restitution: 0.1,

  parts: [
    // --------------------------------------------------------
    // ROCK WALL WITH THREE CIRCULAR OPENINGS
    // --------------------------------------------------------

    brick.boxWithHoles(
      [
        STRUCTURE_WIDTH,
        STRUCTURE_HEIGHT,
        STRUCTURE_LENGTH,
      ],
      [0, STRUCTURE_Y, 0],
      {
        id: "rock-wall",
        color: ROCK_COLOR,
        roughness: 1,

        holes: TUNNELS.map((tunnel) => ({
          x: tunnel.x,
          y:
            tunnel.floorHeight +
            BALL_RADIUS -
            STRUCTURE_Y,
          radius: tunnel.diameter / 2,
        })),

        segments: 32,
      }
    ),

    // --------------------------------------------------------
    // ELEVATED TUNNEL FLOORS
    // --------------------------------------------------------

    ...TUNNELS.map((tunnel) =>
      brick.box(
        [
          tunnel.diameter,
          FLOOR_THICKNESS,
          STRUCTURE_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight -
            FLOOR_THICKNESS / 2,
          0,
        ],
        {
          id: `${tunnel.id}-floor`,
          color: FLOOR_COLOR,
          friction: 0.9,
          roughness: 0.9,
        }
      )
    ),

    // --------------------------------------------------------
    // FRONT CLIMBING RAMPS
    // --------------------------------------------------------

    ...TUNNELS.map((tunnel) =>
      brick.wedge(
        [
          tunnel.diameter,
          tunnel.floorHeight,
          RAMP_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight / 2,
          STRUCTURE_LENGTH / 2 +
            RAMP_LENGTH / 2,
        ],
        {
          id: `${tunnel.id}-front-ramp`,
          color: RAMP_COLOR,
          roughness: 0.9,
          friction: 0.85,
        }
      )
    ),

    // --------------------------------------------------------
    // BACK DESCENDING RAMPS
    // --------------------------------------------------------

    ...TUNNELS.map((tunnel) =>
      brick.wedge(
        [
          tunnel.diameter,
          tunnel.floorHeight,
          RAMP_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight / 2,
          -STRUCTURE_LENGTH / 2 -
            RAMP_LENGTH / 2,
        ],
        {
          id: `${tunnel.id}-back-ramp`,
          rotation: [0, Math.PI, 0],
          color: RAMP_COLOR,
          roughness: 0.9,
          friction: 0.85,
        }
      )
    ),
  ],
});

// ============================================================
// BASE COURSE
// ============================================================


const course06 = {
  id: "course-06",
  number: 6,
  name: "3 Tunnels",
  environment: "garden",
  par: 2,

  // --------------------------------------------------
  // START AND HOLE
  // --------------------------------------------------

  ballStart: [0, 0.25, 9.5],

  hole: {
    position: [0, 0, -9.4],
    radius: 0.43,
  },

  // --------------------------------------------------
  // COURSE BOUNDARY
  // --------------------------------------------------

  ...createCourseShape({
    type: "rounded",
    points: FIELD_POINTS,

    tolerance: 0.025,
    maxSegmentLength: 0.5,

    color: GRASS_COLOR,

    wall: {
      color: WALL_COLOR,
      height: 0.55,
      thickness: 0.25,
      friction: 0.8,
      restitution: 0.3,
    },
  }),

  // --------------------------------------------------
  // FLAT TERRAIN
  // --------------------------------------------------

  terrain: {
    width: 24,
    length: 32,
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,

    features: [],
  },

  // --------------------------------------------------
  // THREE PHYSICAL TUNNELS
  // --------------------------------------------------

  obstacles: [
    tunnelStructure,
  ],
};

export default course06;
