// src/courses/course13.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 9;
const length = 26;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course13 = {
  id: "course-13",
  number: 13,
  name: "Twin Windmills",
  environment: "garden",
  par: 5,
  ballStart: [0, 0.25, 11],
  hole: { position: [0, 0, -11], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#408f58",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "windmill", position: [-2.15, 0, 3.5], towerWidth: 1.8, towerHeight: 4.4, towerDepth: 1.2, openingWidth: 0.95, openingHeight: 0.9, bladeLength: 2.5, bladeWidth: 0.2, bladeDepth: 0.12, bladeCount: 4, axleHeight: 3.25, speed: 0.8, direction: 1, phase: Math.PI / 4, towerColor: "#c5b29b", roofColor: "#6e4939" },
    { type: "windmill", position: [2.15, 0, -3.5], towerWidth: 1.8, towerHeight: 4.4, towerDepth: 1.2, openingWidth: 0.95, openingHeight: 0.9, bladeLength: 2.5, bladeWidth: 0.2, bladeDepth: 0.12, bladeCount: 4, axleHeight: 3.25, speed: 1.1, direction: -1, phase: 0, towerColor: "#bca78d", roofColor: "#604737" },
    { type: "bumper", position: [0, 0.4, 0], radius: 0.55, color: "#e8ae59" },
  ],
};

export default course13;
