// src/courses/course03.js

import { createCourseShape } from "./courseBuilder";

// ============================================================
// COURSE 03 — LAKE ISLAND
// ============================================================

const GRASS_COLOR = "#328b50";
const SHORE_COLOR = "#806d55";
const BRIDGE_COLOR = "#a87945";
const WATER_COLOR = "#1479a8";
const BASIN_COLOR = "#52636a";

// ------------------------------------------------------------
// Polygon helpers
// ------------------------------------------------------------

function roundedPolygon(points, radius = 0.35, steps = 5) {
  if (!Array.isArray(points) || points.length < 3) {
    return [];
  }

  const result = [];

  for (let i = 0; i < points.length; i++) {
    const previous = points[(i - 1 + points.length) % points.length];

    const current = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = previous[0] - current[0];
    const dz1 = previous[1] - current[1];

    const dx2 = next[0] - current[0];
    const dz2 = next[1] - current[1];

    const length1 = Math.hypot(dx1, dz1);
    const length2 = Math.hypot(dx2, dz2);

    if (length1 < 1e-6 || length2 < 1e-6) {
      result.push([...current]);
      continue;
    }

    const distance = Math.min(radius, length1 * 0.35, length2 * 0.35);

    const start = [
      current[0] + (dx1 / length1) * distance,
      current[1] + (dz1 / length1) * distance,
    ];

    const end = [
      current[0] + (dx2 / length2) * distance,
      current[1] + (dz2 / length2) * distance,
    ];

    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const u = 1 - t;

      const x = u * u * start[0] + 2 * u * t * current[0] + t * t * end[0];
      const z = u * u * start[1] + 2 * u * t * current[1] + t * t * end[1];

      result.push([x, z]);
    }
  }

  return result;
}

// ------------------------------------------------------------
// Outer course boundary
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Lake outline
// ------------------------------------------------------------

// The lake occupies the central area between the two greens.
// Its shape is deliberately inset from the outer course.

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

// ------------------------------------------------------------
// Central island
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Course geometry
// ------------------------------------------------------------

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

// The island is a separate playable floor.

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

// ------------------------------------------------------------
// Bridges
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Course definition
// ------------------------------------------------------------

const course03 = {
  id: "course-03",
  number: 3,

  name: "Lake Island",
  environment: "garden",

  par: 4,

  // Starting green at the south end (positive Z).
  ballStart: [0, 0.25, 8],

  // Hole green at the north end (negative Z).
  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  // ----------------------------------------------------------
  // Playable floors
  // ----------------------------------------------------------

sections: [
  // Main course floor — preserve its original ID
  // so CourseGeometryRenderer cuts the golf cup.
  ...outerShape.sections,

  // Separate central island floor
  ...islandShape.sections.map((section, index) => ({
    ...section,
    id: `island-floor-${index}`,
    excludeWater: true,
  })),
],

  // ----------------------------------------------------------
  // Course perimeter
  // ----------------------------------------------------------

  // Only the outside boundary has a raised wall.
  // No walls around the lake or island, so the
  // bridges have unobstructed entrances.

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
  // Lake
  // ----------------------------------------------------------

  surfaces: [
    {
      id: "lake-water",

      type: "water",
      surface: "water",

      position: [0, 0, 0],

      // Outer lake boundary.
      points: LAKE,

      // The island is excluded from the water geometry.
      holes: [ISLAND],

      depth: 0.65,

      color: WATER_COLOR,
      basinColor: BASIN_COLOR,

      respawnPosition: [0, 0.5, 8],
    },
  ],

  // ----------------------------------------------------------
  // Obstacles
  // ----------------------------------------------------------

  obstacles: [
    // Starting green -> island.
    //
    // Lake begins near Z = +5.5.
    // Island begins near Z = +3.1.
    //
    // Bridge spans Z = 2.8 to 5.8.

    createBridge(
      "bridge-start-island",
      4.3,
      3.0
    ),

    // Island -> hole green.
    //
    // Island ends near Z = -3.1.
    // Lake ends near Z = -5.5.
    //
    // Bridge spans Z = -5.8 to -2.8.

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

    // Flat terrain ensures that the two bridges
    // align with the playable grass.
    features: [],
  },
};

export default course03;
