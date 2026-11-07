// src/courses/course05.js

import {
  createRectangularFloor,
  createPolygonWalls,
} from "./courseBuilder";

const points = [
  [-4, -10],
  [4, -10],
  [4, 10],
  [-4, 10],
];

const course05 = {
  id: "course-05",
  number: 5,
  name: "Windmill",
  environment: "neon",
  par: 4,

  ballStart: [0, 0.25, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  sections: [
    createRectangularFloor({
      id: "main-floor",
      width: 8,
      length: 20,
      color: "#2d8951",
    }),
  ],

  walls: createPolygonWalls({ points }),

  surfaces: [],

  ramps: [],

  obstacles: [
    {
      type: "windmill",
      position: [0, 0.4, 0],
      bladeLength: 5,
      bladeWidth: 0.35,
      speed: 1.5,
      color: "#eeeeee",
    },

    {
      type: "block",
      position: [-2.5, 0.4, -4],
      size: [1, 0.8, 1],
      color: "#888888",
    },

    {
      type: "block",
      position: [2.5, 0.4, -4],
      size: [1, 0.8, 1],
      color: "#888888",
    },

    {
      id: "platform-1",
      type: "movingPlatform",
      position: [0, 0.5, 0],
      size: [3, 0.3, 3],
      axis: "x",
      distance: 2,
      speed: 0.8,
      friction: 1.5,
      color: "#ffcc33",
    },

    {
      type: "conveyorBelt",
      position: [0, 0.1, -3],
      size: [3, 0.2, 5],
      direction: [0, 0, -1],
      speed: 2,
      acceleration: 8,
      color: "#26383e",
    },

    {
      type: "tunnel",
      position: [0, 0.75, -4],
      size: [2, 1.5, 5],
      thickness: 0.15,
      color: "#586b76",
    },

    {
      type: "pipe",
      position: [4, 1, -4],
      radius: 0.8,
      length: 5,
      thickness: 0.12,
      segments: 20,
      color: "#647d88",
    },

    {
      type: "pipe",
      position: [4, 1.5, -4],
      radius: 0.8,
      length: 5,
      rotation: [-0.15, 0, 0],
      color: "#647d88",
    },

    {
      type: "bridge",
      position: [0, 1.5, -5],
      size: [2.5, 0.25, 6],
      rails: true,
      railHeight: 0.5,
      railThickness: 0.12,
      friction: 0.8,
      color: "#80664c",
      railColor: "#4a3829",
    },

    {
      type: "bridge",
      position: [0, 1.5, -5],
      size: [2.5, 0.25, 6],
      rails: true,
      railHeight: 0.5,
      railThickness: 0.12,
      friction: 0.8,
      color: "#80664c",
      railColor: "#4a3829",
      rotation: [-0.15, 0, 0],
    },

    {
      type: "elevatedPath",
      position: [4, 2, -6],
      size: [2, 0.2, 8],
      supportHeight: 1.5,
      supportWidth: 0.3,
      supports: true,
      friction: 0.8,
      color: "#6b7c86",
    },

  ],
};

export default course05;
