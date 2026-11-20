import { createCourseShape } from "./courseBuilder";
import { ridge } from "./terrainPresets";

// COURSE 10 — NEEDLE PASS
// Squeezed corridor and alternating fixed barriers demand accurate contact.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "path",
  points: [
      [0, 9],
      [-1.2, 6],
      [1.8, 2],
      [-1.7, -2],
      [1.8, -6],
      [0, -9]
    ],
  width: 2.8,
  curved: true,
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course10 = {
  ...shape,
  id: "course-10",
  number: 10,
  name: "Needle Pass",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [],
  ramps: [],
  obstacles: [
    { id: "rock-1", type: "block", position: [1.1, 0.35, 3.5], size: [0.55, 0.7, 0.8], color: "#776e62" },
    { id: "rock-2", type: "block", position: [-1.1, 0.35, -3.2], size: [0.55, 0.7, 0.8], color: "#776e62" },
  ],

  terrain: {
    width: 32,
    length: 42,
    resolution: 64,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      ridge({
        start: [-3, 1],
        end: [3, 1],
        width: 2.4,
        height: 0.3
      }),
    ],
  },
};

export default course10;
