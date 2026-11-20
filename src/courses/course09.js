// src/courses/course09.js

import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";
import { hill, valley } from "./terrainPresets";

// COURSE 09 — DUNE RUN
// Three sand bunkers placed to punish the obvious straight shots.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const OUTER = roundedPolygon(
  [
      [-4.5, 11],
      [4.5, 11],
      [5, 9],
      [4.7, 3],
      [5, -3],
      [4.7, -9],
      [4, -11],
      [-4, -11],
      [-4.7, -9],
      [-5, -3],
      [-4.7, 3],
      [-5, 9]
    ],
  0.65,
  6
);

const shape = createCourseShape({
  type: "polygon",
  points: OUTER,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course09 = {
  ...shape,
  id: "course-09",
  number: 9,
  name: "Dune Run",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [-1.4, 0, 6.2], size: [3.3, 2.2], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [1.5, 0, 1.3], size: [3.4, 2.6], color: "#d8bc7a" },
    { id: "sand-3", surface: "sand", position: [-1.7, 0, -4.2], size: [3, 2.4], color: "#d8bc7a" },
  ],
  ramps: [],
  obstacles: [],

  terrain: {
    width: 32,
    length: 42,
    resolution: 64,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      hill({
        position: [-2.4, 5.5],
        radius: 2.5,
        height: 0.35
      }),
      hill({
        position: [2, -2],
        radius: 2.9,
        height: 0.4
      }),
      valley({
        position: [-1, -5],
        radius: 2.2,
        depth: 0.25
      }),
    ],
  },
};

export default course09;
