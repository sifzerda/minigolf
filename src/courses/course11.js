// src/courses/course11.js

import { createCourseShape } from "./courseBuilder";
import { hill, valley } from "./terrainPresets";
import { brick, assembly, bridge, tunnel, elevatedPath, repeat } from "./bricks";

// COURSE 11 — TWO WAYS
// Two alternate routes with different hazards meet at the cup.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = {
  color: "#786b50", height: 0.55, thickness: 0.25,
  friction: 0.8, restitution: 0.3,
};

const shape = createCourseShape({
  type: "compound",
  parts: [
    {
      type: "path",
      points: [
        [0, 9],
        [-1.8, 5],
        [-3, 0],
        [-2.2, -5],
        [0, -9]
      ],
      width: 3,
      curved: true
    },
    {
      type: "path",
      points: [
        [0, 9],
        [2.1, 5],
        [3.2, 0],
        [2.2, -5],
        [0, -9]
      ],
      width: 2.8,
      curved: true
    }
  ],
  color: GRASS_COLOR,
  wall: WALL_STYLE,
});

const course11 = {
  ...shape,
  id: "course-11",
  number: 11,
  name: "Two Ways",
  environment: "garden",
  par: 4,

  ballStart: [0, 0.25, 9],
  hole: { position: [0, 0, -9], radius: 0.43 },

  walls: [],
  surfaces: [
    { id: "sand-1", surface: "sand", position: [-2.6, 0, 2.2], size: [2.2, 2.4], color: "#d8bc7a" },
    { id: "sand-2", surface: "sand", position: [2.4, 0, -2], size: [2, 2.8], color: "#d8bc7a" },
  ],
  ramps: [],

  obstacles: [

    bridge({
      position: [0, 1, -5],
      size: [3, 0.25, 6],
      rails: true,
      ramps: true,
    }),

    tunnel({
      position: [0, 0.75, 0],
      size: [2.5, 1.5, 4],
      thickness: 0.2,
      color: "#586b76",
    }),

    elevatedPath({
      position: [0, 1.5, -9],
      size: [2, 0.2, 8],
      rails: true,
      supports: true,
      ramps: true,
    }),

    assembly({
      position: [0, 0, 5],

      parts: [
        brick.box(
          [4, 0.3, 2],
          [0, 0.15, 0],
          { color: "#8a7968" }
        ),

        ...repeat(3, (i) =>
          brick.pyramid(
            [0.7, 0.8, 0.7],
            [(i - 1) * 1.3, 0.7, 0],
            { color: "#db9248" }
          )
        ),
      ],

    }),

  ],

  terrain: {
    width: 32,
    length: 42,
    resolution: 64,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [

      hill({
        position: [-2.8, 0],
        radius: 2.1,
        height: 0.3
      }),

      valley({
        position: [2.8, 0],
        radius: 2.2,
        depth: 0.2
      }),

    ],
  },
};

export default course11;
