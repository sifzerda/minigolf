// src/courses/course14.js
import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const width = 8;
const length = 24;
const points = [
  [-width / 2, -length / 2],
  [width / 2, -length / 2],
  [width / 2, length / 2],
  [-width / 2, length / 2],
];

const course14 = {
  id: "course-14",
  number: 14,
  name: "Horizontal Loop",
  environment: "snow",
  par: 4,
  ballStart: [0, 0.25, 10],
  hole: { position: [0, 0, -10], radius: 0.43 },
  sections: [
    createRectangularFloor({
      id: "main-floor",
      width,
      length,
      color: "#a9d5df",
    }),
  ],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
  {
    type: "horizontalLoop",
    position: [0, 0, -1],
    radius: 1.6,
    width: 1.25,
    exitOffset: 3.6,
    approachLength: 1.5,
    departureLength: 1.5,
    railHeight: 0.3,
    color: "#eab308",
  },
 ],
};

export default course14;
