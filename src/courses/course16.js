// src/courses/course16.js
import { createCourseShape } from "./courseBuilder";
import { ridge } from "./terrainPresets";

// COURSE 16 — FOUR CORNERS
// Sharp turns and rolling grades punish shots that are too powerful.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "path",
  points: [
      [-2.5, 9],
      [2.6, 6],
      [2.6, 1],
      [-2.6, -1],
      [-2.6, -6],
      [2.5, -8],
      [2.5, -10]
    ],
  width: 2.6,
  curved: false,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course16 = {
  ...shape,
  id: "course-16",
  number: 16,
  name: "Four Corners",
  environment: "garden",
  par: 5,

  ballStart: [-2.5, 0.25, 9],
  hole: { position: [2.5, 0, -10], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [2.7, 0, 5.7], size: [1.7, 1.6], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [-2.6, 0, -5.5], size: [1.8, 1.8], color: "#d8bc7a" },
  ],
  ramps: [],
  obstacles: [],

  terrain: {
    width: 32,
    length: 42,
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      ridge({
        start: [-4, 4],
        end: [4, 4],
        width: 3,
        height: 0.35
      }),
      ridge({
        start: [-4, -4],
        end: [4, -4],
        width: 3,
        height: 0.45
      }),
    ],
  },
};

export default course16;
