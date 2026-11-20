// src/courses/course17.js
import { createCourseShape } from "./courseBuilder";
import { hill, ridge } from "./terrainPresets";

// COURSE 17 — RISK AND REWARD
// Forked routes: shorter path with narrow openings, safer route with sand.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "compound",
  parts: [
      {
        type: "path",
        points: [
          [0, 10],
          [-2.9, 5],
          [-2.5, 0],
          [-2.8, -5],
          [0, -10]
        ],
        width: 2.2,
        curved: true
      },
      {
        type: "path",
        points: [
          [0, 10],
          [3.4, 5],
          [3.7, 0],
          [3.4, -5],
          [0, -10]
        ],
        width: 3.5,
        curved: true
      }
    ],
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course17 = {
  ...shape,
  id: "course-17",
  number: 17,
  name: "Risk and Reward",
  environment: "garden",
  par: 5,

  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [3.5, 0, 3], size: [2.5, 3], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [3.3, 0, -3], size: [2.5, 3], color: "#d8bc7a" },
  ],
  ramps: [],
  obstacles: [
    { id: "rock-1", type: "block", position: [-2.5, 0.35, 0], size: [0.6, 0.7, 0.7], color: "#776e62" },
  ],

  terrain: {
    width: 32,
    length: 42,
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      ridge({
        start: [-4, 1],
        end: [4, 1],
        width: 3,
        height: 0.45
      }),
      hill({
        position: [-3, 4],
        radius: 1.8,
        height: 0.25
      }),
    ],
  },
};

export default course17;
