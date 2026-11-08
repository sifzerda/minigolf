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
  name: "Incline Loop",
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
  {
    type: "inclinedLoop",
    position: [0, 0, -5],
    radius: 1.5,
    width: 1.25,
    rise: 1.1,
    exitOffset: 3.6,
    approachLength: 1.5,
    departureLength: 3,
    railHeight: 0.3,
    color: "#ef4444",
  }, ],
};

export default course15;
