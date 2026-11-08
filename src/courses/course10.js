import { createPolygonFloor, createPolygonWalls } from "./courseBuilder";

const points = [
  [-3.5, 10], [3.5, 10], [3.5, 3], [1.5, 3],
  [1.5, -3], [3.5, -3], [3.5, -10], [-3.5, -10],
  [-3.5, -5], [-1.5, -5], [-1.5, 5], [-3.5, 5],
];

const course10 = {
  id: "course-10",
  number: 10,
  name: "Frozen Pass",
  environment: "snow",
  par: 4,
  ballStart: [0, 0.25, 8],
  hole: { position: [0, 0, -8], radius: 0.43 },
  sections: [createPolygonFloor({ id: "main-floor", points, color: "#a9d8d9" })],
  walls: createPolygonWalls({ points }),
  surfaces: [],
  ramps: [],
  obstacles: [
    { type: "block", position: [0.2, 0.4, 4], size: [1.2, 0.8, 0.8], color: "#d5eef2" },
    { type: "bumper", position: [0.3, 0.4, 0], radius: 0.45, color: "#79c7e7" },
    { type: "block", position: [0.2, 0.4, -4], size: [1.2, 0.8, 0.8], color: "#d5eef2" },
  ],
};

export default course10;
