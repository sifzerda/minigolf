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
  name: "Vertical Loop",
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

   {
    type: "verticalLoop",
    position: [0, 0, 3],
    radius: 1.35,
    width: 1.3,
    exitOffset: 3.6,
    approachLength: 1.2,
    departureLength: 1.2,
    railHeight: 0.4,
    friction: 0.65,
    color: "#facc15",
  },
 
  ],
};

export default course13;
