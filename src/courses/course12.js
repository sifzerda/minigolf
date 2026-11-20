// src/courses/course12.js
import { createCourseShape } from "./courseBuilder";
import { ridge } from "./terrainPresets";

// COURSE 12 — SUMMIT STEPS
// Multiple transverse ridges create uphill and downhill pace changes.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "path",
  points: [
      [0, 9],
      [0.4, 6],
      [-1.7, 3],
      [1.5, 0],
      [-1.5, -3],
      [0.7, -6],
      [0, -9]
    ],
  width: 3.8,
  curved: true,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course12 = {
  ...shape,
  id: "course-12",
  number: 12,
  name: "Summit Steps",
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
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      ridge({
        start: [-5, 5.0],
        end: [5, 5.0],
        width: 2.6,
        height: 0.34
      }),
      ridge({
        start: [-5, 0],
        end: [5, 0],
        width: 2.8,
        height: 0.65
      }),
      ridge({
        start: [-5, -5],
        end: [5, -5],
        width: 3.0,
        height: 0.82
      }),
    ],
  },
};

export default course12;
