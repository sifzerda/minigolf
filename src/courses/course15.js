// src/courses/course15.js
import { createCourseShape } from "./courseBuilder";
import { hill, valley } from "./terrainPresets";

// COURSE 15 — SERPENTS SPINE
// The tightest winding fairway yet, with sand slowing risky bank shots.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "path",
  points: [
      [0, 10],
      [-2.6, 7],
      [2.8, 4],
      [-2.9, 1],
      [2.8, -2],
      [-2.8, -5],
      [2.5, -8],
      [0, -10]
    ],
  width: 2.4,
  curved: true,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course15 = {
  ...shape,
  id: "course-15",
  number: 15,
  name: "Serpents Spine",
  environment: "garden",
  par: 5,

  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [-2.7, 0, 6.5], size: [1.6, 1.8], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [2.7, 0, -2], size: [1.5, 1.8], color: "#d8bc7a" },
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
      hill({
        position: [-2.7, 7],
        radius: 1.4,
        height: 0.26
      }),
      valley({
        position: [2.7, -2],
        radius: 1.2,
        depth: 0.18
      }),
    ],
  },
};

export default course15;
