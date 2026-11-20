// src/courses/course18.js
import { createCourseShape } from "./courseBuilder";
import { roundedPolygon, createLakeSurface } from "./coursePresets";
import { hill, ridge, valley } from "./terrainPresets";

// COURSE 18 — THE GRAND FINALE
// Final examination: sand, blocking rocks, ridge control and narrow bridge over water.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = { color: "#786b50", height: 0.6, thickness: 0.25, friction: 0.8, restitution: 0.3 };

const OUTER = roundedPolygon([
  [-4, -12], [4, -12], [5.3, -10], [5.3, -5], [4.6, -2],
  [4.8, 2], [5.3, 5], [5.3, 10], [4, 12], [-4, 12],
  [-5.3, 10], [-5.3, 5], [-4.6, 2], [-4.8, -2], [-5.3, -5], [-5.3, -10],
], 0.65, 6);

const LAKE = roundedPolygon([
  [-4.05, -2.2], [4.05, -2.2], [4.2, -1.3],
  [4.2, 1.3], [4.05, 2.2], [-4.05, 2.2], [-4.2, 1.3], [-4.2, -1.3],
], 0.25, 4);

const shape = createCourseShape({ type: "polygon", points: OUTER, color: GRASS_COLOR, wall: WALL_STYLE });

const course18 = {
  ...shape,
  id: "course-18",
  number: 18,
  name: "The Grand Finale",
  environment: "garden",
  par: 6,

  ballStart: [0, 0.25, 10.5],
  hole: { position: [0, 0, -10.5], radius: 0.43 },

  walls: [],
  ramps: [],
  surfaces: [
    { id: "top-sand", surface: "sand", position: [-1.65, 0, 6.7], size: [3.0, 2.1], color: "#d8bc7a" },
    { id: "bottom-sand", surface: "sand", position: [1.7, 0, -6.8], size: [3.0, 2.0], color: "#d8bc7a" },
    createLakeSurface({
      id: "final-lake",
      points: LAKE,
      holes: [],
      position: [0, 0, 0],
      depth: 0.65,
      color: "#1479a8",
      basinColor: "#52636a",
      respawnPosition: [0, 0.5, 10.5],
    }),
  ],
  obstacles: [
    { id: "upper-block", type: "block", position: [1.9, 0.4, 7.2], size: [1, 0.8, 1.1], color: "#766c60" },
    { id: "lower-block", type: "block", position: [-1.9, 0.4, -7.5], size: [1, 0.8, 1.1], color: "#766c60" },
    {
      id: "final-bridge",
      type: "bridge",
      position: [0, -0.1, 0],
      rotation: [0, 0, 0],
      size: [0.6, 0.2, 5.1],
      color: "#a87945",
      rails: false,
      ramps: false,
      friction: 0.9,
      restitution: 0,
    },
  ],
  terrain: {
    width: 34,
    length: 46,
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [
      ridge({ start: [-5, 5], end: [5, 5], width: 2.3, height: 0.42 }),
      ridge({ start: [-5, -5], end: [5, -5], width: 2.7, height: 0.52 }),
      hill({ position: [3.3, 8.3], radius: 1.8, height: 0.28 }),
      valley({ position: [-3.1, -8.3], radius: 1.8, depth: 0.2 }),
    ],
  },
};

export default course18;
