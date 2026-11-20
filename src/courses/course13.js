// src/courses/course13.js
import { createCourseShape } from "./courseBuilder";
import { roundedPolygon, createIslandSections, createLakeSurface } from "./coursePresets";

// COURSE 13 — ISLAND HOPPING
// More precise sequel to Course 03, with thinner bridges and a larger lake.

const GRASS_COLOR = "#328b50";
const WALL_STYLE = { color: "#806d55", height: 0.6, thickness: 0.25, friction: 0.8, restitution: 0.3 };

const OUTER = roundedPolygon([
  [-4.5, -11], [4.5, -11], [5.2, -9.5], [5.2, 9.5],
  [4.5, 11], [-4.5, 11], [-5.2, 9.5], [-5.2, -9.5],
], 0.6, 5);

const LAKE = roundedPolygon([
  [-3.6, -6.8], [3.6, -6.8], [4.25, -5.5], [4.25, 5.5],
  [3.6, 6.8], [-3.6, 6.8], [-4.25, 5.5], [-4.25, -5.5],
], 0.45, 5);

const ISLAND = roundedPolygon([
  [-1.1, -2.7], [1.1, -2.7], [1.35, -1.8], [1.35, 1.8],
  [1.1, 2.7], [-1.1, 2.7], [-1.35, 1.8], [-1.35, -1.8],
], 0.3, 5);

const outer = createCourseShape({ type: "polygon", points: OUTER, color: GRASS_COLOR, wall: WALL_STYLE });
const island = createCourseShape({ type: "polygon", points: ISLAND, color: GRASS_COLOR });

function bridge(id, z) {
  return {
    id,
    type: "bridge",
    position: [0, -0.1, z],
    rotation: [0, 0, 0],
    size: [0.65, 0.2, 4.5],
    color: "#9d7445",
    rails: false,
    ramps: false,
    friction: 0.9,
    restitution: 0,
  };
}

const course13 = {
  id: "course-13",
  number: 13,
  name: "Island Hopping",
  environment: "garden",
  par: 5,

  ballStart: [0, 0.25, 9.5],
  hole: { position: [0, 0, -9.5], radius: 0.43 },

  sections: [
    ...outer.sections,
    ...createIslandSections(island.sections, { id: "island" }),
  ],
  boundaryRings: [OUTER],
  wallStyle: WALL_STYLE,
  walls: [],
  surfaces: [
    createLakeSurface({
      id: "central-lake",
      points: LAKE,
      holes: [ISLAND],
      position: [0, 0, 0],
      depth: 0.65,
      color: "#1479a8",
      basinColor: "#52636a",
      respawnPosition: [0, 0.5, 9.5],
    }),
  ],
  obstacles: [
    bridge("north-bridge", 4.75),
    bridge("south-bridge", -4.75),
  ],
  ramps: [],
  terrain: {
    width: 32,
    length: 42,
    resolution: 96,
    baseHeight: 0,
    defaultSurface: "grass",
    color: GRASS_COLOR,
    features: [],
  },
};

export default course13;
