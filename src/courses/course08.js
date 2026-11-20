// src/courses/course08.js

import { createCourseShape } from "./courseBuilder";
import { hill, valley } from "./terrainPresets";

// COURSE 08 — SWITCHBACK
// A winding corridor that rewards bank shots instead of raw power.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "path",
  points: [
      [0, 9],
      [0, 6],
      [-2.6, 3],
      [2.5, 0],
      [-2.4, -3],
      [2, -6],
      [0, -9]
    ],
  width: 3.3,
  curved: true,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course08 = {
  ...shape,
  id: "course-08",
  number: 8,
  name: "Switchback",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [],
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
        position: [-2.8, 3],
        radius: 1.7,
        height: 0.3
      }),
      valley({
        position: [2, 0],
        radius: 1.7,
        depth: 0.22
      }),
    ],
  },
};

export default course08;
