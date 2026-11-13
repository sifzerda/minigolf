// src/courses/course04.js

import { createCourseShape } from "./courseBuilder";

// ============================================================
// COURSE 04 — ROLLING HILLS
// ============================================================

const GRASS_COLOR = "#328b50";
const WALL_COLOR = "#786b50";

// ------------------------------------------------------------
// Course boundary
// ------------------------------------------------------------

function roundedPolygon(points, radius = 0.5, steps = 6) {
  const result = [];

  for (let i = 0; i < points.length; i++) {
    const previous = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = previous[0] - current[0];
    const dz1 = previous[1] - current[1];

    const dx2 = next[0] - current[0];
    const dz2 = next[1] - current[1];

    const len1 = Math.hypot(dx1, dz1);
    const len2 = Math.hypot(dx2, dz2);

    if (len1 < 1e-6 || len2 < 1e-6) {
      result.push([...current]);
      continue;
    }

    const distance = Math.min(radius, len1 * 0.35, len2 * 0.35);

    const start = [
      current[0] + (dx1 / len1) * distance,
      current[1] + (dz1 / len1) * distance,
    ];

    const end = [
      current[0] + (dx2 / len2) * distance,
      current[1] + (dz2 / len2) * distance,
    ];

    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const u = 1 - t;

      result.push([
        u * u * start[0] +
        2 * u * t * current[0] +
        t * t * end[0],

        u * u * start[1] +
        2 * u * t * current[1] +
        t * t * end[1],
      ]);
    }
  }

  return result;
}

// ------------------------------------------------------------
// Main playable area
// ------------------------------------------------------------

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
  ], 0.8, 6);

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

// ------------------------------------------------------------
// Course definition
// ------------------------------------------------------------

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

  terrain: {
    width: 24,
    length: 32,
    resolution: 96,

    baseHeight: 0,
    defaultSurface: "grass",

    features: [
      // First hill
      {
        type: "deformation",
        position: [0, 4.5],
        radiusX: 3.4,
        radiusZ: 2.6,
        height: 0.7,
        blend: "add",
      },
      {
        type: "deformation",
        position: [0, -3],
        radiusX: 3.8,
        radiusZ: 2.8,
        height: 1,
        blend: "max",
      },
      {
        type: "valley",
        position: [0, 0.5],
        radius: 2.2,
        depth: 0.2,
        blend: "add",
      },

      // Second taller hill
      {
        type: "deformation",
        position: [0, -3.0],
        radiusX: 3.8,
        radiusZ: 2.8,
        height: 1.0,
        falloff: 1.4,
      },

      // small hill
      {
        type: "hill",
        position: [2.3, -5.8],
        radius: 1.8,
        height: 0.35,
      },
    ],
  },

};

export default course04;
