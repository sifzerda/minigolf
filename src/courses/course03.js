// src/courses/course03.js

import { createCourseShape } from "./courseBuilder";

import {
  roundedPolygon,
  createIslandSections,
  createLakeSurface,
} from "./coursePresets";

// ============================================================
// COURSE 03 — LAKE ISLAND
// ============================================================

const GRASS_COLOR = "#328b50";
const SHORE_COLOR = "#806d55";
const BRIDGE_COLOR = "#a87945";
const WATER_COLOR = "#1479a8";
const BASIN_COLOR = "#52636a";

// ============================================================
// COURSE GEOMETRY
// ============================================================

// Outer course boundary
const OUTER = roundedPolygon(
  [
    [-4.0, -10.0],
    [4.0, -10.0],
    [5.0, -9.0],
    [5.0, 9.0],
    [4.0, 10.0],
    [-4.0, 10.0],
    [-5.0, 9.0],
    [-5.0, -9.0],
  ],
  0.5,
  6
);

// Lake outline
const LAKE = roundedPolygon(
  [
    [-2.8, -5.5],
    [-3.8, -4.6],
    [-4.1, -2.5],
    [-4.1, 2.5],
    [-3.8, 4.6],
    [-2.8, 5.5],
    [2.8, 5.5],
    [3.8, 4.6],
    [4.1, 2.5],
    [4.1, -2.5],
    [3.8, -4.6],
    [2.8, -5.5],
  ],
  0.4,
  5
);

// Central playable island
const ISLAND = roundedPolygon(
  [
    [-0.8, -3.1],
    [-1.2, -2.4],
    [-1.3, -0.8],
    [-1.3, 0.8],
    [-1.2, 2.4],
    [-0.8, 3.1],
    [0.8, 3.1],
    [1.2, 2.4],
    [1.3, 0.8],
    [1.3, -0.8],
    [1.2, -2.4],
    [0.8, -3.1],
  ],
  0.25,
  5
);

// ============================================================
// PLAYABLE FLOORS
// ============================================================

const outerShape = createCourseShape({
  type: "polygon",
  points: OUTER,
  color: GRASS_COLOR,
  wall: {
    color: SHORE_COLOR,
    height: 0.65,
    thickness: 0.25,
  },
});

const islandShape = createCourseShape({
  type: "polygon",
  points: ISLAND,
  color: GRASS_COLOR,
  wall: {
    color: SHORE_COLOR,
    height: 0.65,
    thickness: 0.25,
  },
});

// ============================================================
// BRIDGE HELPER
// ============================================================

const BRIDGE_WIDTH = 0.7;
const BRIDGE_THICKNESS = 0.2;

function createBridge(id, z, length) {
  return {
    id,
    type: "bridge",

    position: [
      0,
      -BRIDGE_THICKNESS / 2,
      z,
    ],

    rotation: [0, 0, 0],

    size: [
      BRIDGE_WIDTH,
      BRIDGE_THICKNESS,
      length,
    ],

    color: BRIDGE_COLOR,

    rails: false,
    ramps: false,

    friction: 0.9,
    restitution: 0,
  };
}

// ============================================================
// COURSE DEFINITION
// ============================================================

const course03 = {
  id: "course-03",
  number: 3,
  name: "Lake Island",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Playable floors
  // ----------------------------------------------------------

  sections: [
    ...outerShape.sections,

    ...createIslandSections(
      islandShape.sections,
      { id: "island" }
    ),
  ],

  // ----------------------------------------------------------
  // Course boundary
  // ----------------------------------------------------------

  boundaryRings: [OUTER],

  wallStyle: {
    color: SHORE_COLOR,
    height: 0.65,
    thickness: 0.25,
    friction: 0.8,
    restitution: 0.35,
  },

  walls: [],

  // ----------------------------------------------------------
  // Water hazard
  // ----------------------------------------------------------

  surfaces: [
    createLakeSurface({
      id: "lake-water",

      points: LAKE,
      holes: [ISLAND],

      position: [0, 0, 0],

      depth: 0.65,

      color: WATER_COLOR,
      basinColor: BASIN_COLOR,

      respawnPosition: [0, 0.5, 8],
    }),
  ],

  // ----------------------------------------------------------
  // Bridges
  // ----------------------------------------------------------

  obstacles: [
    createBridge(
      "bridge-start-island",
      4.3,
      3.0
    ),

    createBridge(
      "bridge-island-hole",
      -4.3,
      3.0
    ),
  ],

  ramps: [],

  // ----------------------------------------------------------
  // Terrain
  // ----------------------------------------------------------

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,

    baseHeight: 0,
    defaultSurface: "grass",

    features: [],
  },
};

export default course03;
