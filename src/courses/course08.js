// src/courses/course08.js

import { createRectangularFloor, createPolygonWalls } from "./courseBuilder";

const points = [[-3, -10], [3, -10], [3, 10], [-3, 10]];

const course08 = {
  id: "course-08",
  number: 8,
  name: "Windmill and Tunnel",
  environment: "garden",
  par: 4,
  ballStart: [0, 0.25, 8],
  hole: { position: [0, 0, -8], radius: 0.43 },
  sections: [createRectangularFloor({ id: "main-floor", width: 6, length: 20, color: "#388d51" })],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    {
      type: "windmill", position: [0, 0, 0],
      towerWidth: 2.2, towerHeight: 4.8, towerDepth: 1.4,
      openingWidth: 0.9, openingHeight: 0.85,
      bladeLength: 2.7, bladeWidth: 0.22, bladeDepth: 0.12,
      bladeCount: 4, axleHeight: 3.5,
      phase: Math.PI / 4, speed: 1, direction: 1,
      towerColor: "#b6a18c", roofColor: "#704c3b",
      color: "#e8e1d5", hubColor: "#555555",
    },
    { type: "bumper", position: [-1.7, 0.4, -4], radius: 0.45, color: "#db8f52" },
    { type: "bumper", position: [1.7, 0.4, -5.5], radius: 0.45, color: "#db8f52" },


    {
      type: "tunnel",
      position: [0, 0.75, -4],
      size: [2, 1.5, 5],

      thickness: 0.15,
      floor: false,

      friction: 0.7,
      color: "#586b76",
    }



  ],
};

export default course08;
