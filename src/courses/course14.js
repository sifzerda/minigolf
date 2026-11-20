// src/courses/course14.js
import { createCourseShape } from "./courseBuilder";
import { roundedPolygon } from "./coursePresets";
import { hill } from "./terrainPresets";

// COURSE 14 — STONE GAUNTLET
// Staggered immovable rock blocks force carefully chosen bank shots.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const OUTER = roundedPolygon(
  [
      [-4.3, 11],
      [4.3, 11],
      [5, 9],
      [5, -9],
      [4.3, -11],
      [-4.3, -11],
      [-5, -9],
      [-5, 9]
    ],
  0.65,
  5
);

const shape = createCourseShape({
  type: "polygon",
  points: OUTER,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course14 = {
  ...shape,
  id: "course-14",
  number: 14,
  name: "Stone Gauntlet",
  environment: "garden",
  par: 5,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [],
  ramps: [],
  obstacles: [
    { id: "rock-1", type: "block", position: [1.55, 0.4, 6], size: [0.9, 0.8, 1.0], color: "#776e62" },
    { id: "rock-2", type: "block", position: [-1.6, 0.4, 3], size: [0.9, 0.8, 1.0], color: "#776e62" },
    { id: "rock-3", type: "block", position: [1.5, 0.4, 0], size: [0.9, 0.8, 1.0], color: "#776e62" },
    { id: "rock-4", type: "block", position: [-1.5, 0.4, -3], size: [0.9, 0.8, 1.0], color: "#776e62" },
    { id: "rock-5", type: "block", position: [1.4, 0.4, -6], size: [0.9, 0.8, 1.0], color: "#776e62" },
  ],

  terrain: {
    width: 32,
    length: 42,
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      hill({
        position: [2.8, 4],
        radius: 1.6,
        height: 0.22
      }),
      hill({
        position: [-2.8, -4],
        radius: 1.6,
        height: 0.22
      }),
    ],
  },
};

export default course14;
