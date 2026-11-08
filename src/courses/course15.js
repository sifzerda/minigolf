// src/courses/course15.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 9;
const length = 26;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course15 = {
  id: "course-15",
  number: 15,
  name: "Floodplain",
  environment: "garden",
  par: 5,
  ballStart: [0, 0.25, 11],
  hole: { position: [0, 0, -11], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#39865a",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "waterHazard", position: [-2.9, -0.15, 4], size: [2.5, 0.3, 4], color: "#1d93c2", respawnPosition: [0, 0.5, 9] },
    { type: "waterHazard", position: [2.9, -0.15, -2], size: [2.5, 0.3, 4], color: "#1d93c2", respawnPosition: [0, 0.5, 1] },
    { type: "waterHazard", position: [-2.9, -0.15, -7], size: [2.5, 0.3, 3], color: "#1d93c2", respawnPosition: [0, 0.5, -4] },
    { type: "block", position: [0, 0.4, -5], size: [1.3, 0.8, 0.8], color: "#7c745d" },
  ],
};

export default course15;
