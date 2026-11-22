// src/courses/course08.js

import { createCourseShape } from "./courseBuilder.js";

import {
  terrainBrick,
  terrainRegion,
  surfaceBrick,
  fairwayShape,
  withGeography,
} from "./terrainBricks.js";

import {
  brick,
  assembly,
} from "./bricks.js";

import {
  createCourseConstruction,
} from "./courseConstruction.js";

// --------------------------------------------------
// Main course route
// --------------------------------------------------

const route = [
  [0, 9],
  [1, 5],
  [-1, 1],
  [0, -4],
  [0, -9],
];

// --------------------------------------------------
// Course definition
// --------------------------------------------------

const baseCourse = {
  id: "course-08",
  name: "Rolling Hills",
  par: 3,
  environment: "garden",

  ballStart: [0, 0, 8],

  hole: {
    position: [0, 0, -8],
    radius: 0.43,
  },

  // Reuse the existing course shape builder.
  ...createCourseShape(
    fairwayShape({
      points: route,
      width: 5,
      curved: true,

      wall: {
        height: 0.55,
        thickness: 0.25,
        color: "#80664c",
      },
    })
  ),

  terrain: {
    width: 30,
    length: 40,
    resolution: 64,
    baseHeight: 0,
    defaultSurface: "grass",
  },

  obstacles: [],
};

// --------------------------------------------------
// Add geography
// --------------------------------------------------

const courseWithTerrain = withGeography(
  baseCourse,
  {
    features: [
      // Hills either side of the course.
      terrainBrick.hill({
        position: [-5, 3],
        radius: 6,
        height: 1.6,
      }),

      terrainBrick.hill({
        position: [5, -4],
        radius: 5,
        height: 2.2,
      }),

      // Ridge crossing the middle.
      terrainBrick.ridge({
        start: [-6, 0],
        end: [6, 0],
        width: 3,
        height: 0.7,
      }),

      // Flatten the playable route last.
      terrainBrick.fairway({
        points: route,
        width: 5,
        shoulder: 1.5,
        flatten: 1,
        targetHeight: 0,
      }),
    ],

    regions: [
      // Sand-coloured exterior terrain.
      terrainRegion.circle({
        position: [-6, -6],
        radius: 3,
        surface: "sand",
      }),
    ],

    surfaces: [
      // Visible sand patch on a flat fairway.
      surfaceBrick.patch({
        id: "sand-patch",
        position: [0, 0, 5],
        size: [2, 1.5],
        surface: "sand",
        color: "#d7bd82",
      }),

      // Lake cutting through the playable floor.
      surfaceBrick.lake({
        id: "central-lake",
        position: [0, 0, -2],
        size: [2.5, 2],
        depth: 0.7,
        respawnPosition: [0, 0.5, 3],
      }),
    ],
  }
);

// --------------------------------------------------
// Place physical bricks on the final terrain
// --------------------------------------------------

const construction = createCourseConstruction(courseWithTerrain.terrain);

const pyramid = construction.placeOnTerrain(
  assembly({
    position: [1.5, 0, 6],
    parts: [
      brick.pyramid(
        [0.9, 0.8, 0.9],
        [0, 0.4, 0],
        { color: "#d99051" }
      ),
    ],
  }),
  {
    anchor: "bottom",
    sampling: "highest",
  }
);

// --------------------------------------------------
// Final course
// --------------------------------------------------

export default {
  ...courseWithTerrain,
  obstacles: [
    ...courseWithTerrain.obstacles,
    pyramid,
  ],
};
