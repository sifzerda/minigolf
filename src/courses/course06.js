// src/courses/course06.js

const BALL_RADIUS = 0.25;

const STRUCTURE_WIDTH = 11;
const STRUCTURE_LENGTH = 5;

const FLOOR_THICKNESS = 0.22;
const RAMP_LENGTH = 3.2;

const TUNNELS = [
  {
    id: "left",
    x: -3.2,
    diameter: 0.9,
    floorHeight: 0.7,
  },
  {
    id: "middle",
    x: 0,
    diameter: 0.8,
    floorHeight: 1.8,
  },
  {
    id: "right",
    x: 3.2,
    diameter: 0.9,
    floorHeight: 0.7,
  },
];

// Structure extends below the course ground.
const BASE_Y = -0.25;

// Leave solid rock above the highest opening.
const TOP_Y = Math.max(...TUNNELS.map((t) => t.floorHeight + BALL_RADIUS + t.diameter / 2)) + 0.6;

const STRUCTURE_HEIGHT = TOP_Y - BASE_Y;
const STRUCTURE_Y = (BASE_Y + TOP_Y) / 2;

// --------------------------------------------------
// BRICK ASSEMBLY
// --------------------------------------------------

const tunnelStructure = assembly({
  id: "triple-tunnel-structure",

  position: [0, 0, 0],
  rotation: [0, 0, 0],

  terrainAlign: false,
  friction: 0.85,
  restitution: 0.1,

  parts: [
    // One solid box with three circular holes.
    brick.boxWithHoles(
      [
        STRUCTURE_WIDTH,
        STRUCTURE_HEIGHT,
        STRUCTURE_LENGTH,
      ],
      [0, STRUCTURE_Y, 0],
      {
        id: "perforated-rock-wall",
        color: "#82796b",

        holes: TUNNELS.map((tunnel) => ({
          x: tunnel.x,

          // Local Y relative to the box centre.
          y:
            tunnel.floorHeight +
            BALL_RADIUS -
            STRUCTURE_Y,

          radius: tunnel.diameter / 2,
        })),

        segments: 32,
      }
    ),

    // Flat, elevated floors through the holes.
    ...TUNNELS.map((tunnel) =>
      brick.box(
        [
          tunnel.diameter,
          FLOOR_THICKNESS,
          STRUCTURE_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight -
            FLOOR_THICKNESS / 2,
          0,
        ],
        {
          id: `${tunnel.id}-floor`,
          color: "#a87945",
          friction: 0.9,
        }
      )
    ),

    // Front climbing ramps.
    ...TUNNELS.map((tunnel) =>
      brick.wedge(
        [
          tunnel.diameter,
          tunnel.floorHeight,
          RAMP_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight / 2,
          STRUCTURE_LENGTH / 2 +
            RAMP_LENGTH / 2,
        ],
        {
          id: `${tunnel.id}-front-ramp`,
          color: "#b8a58a",
        }
      )
    ),

    // Back descending ramps.
    ...TUNNELS.map((tunnel) =>
      brick.wedge(
        [
          tunnel.diameter,
          tunnel.floorHeight,
          RAMP_LENGTH,
        ],
        [
          tunnel.x,
          tunnel.floorHeight / 2,
          -STRUCTURE_LENGTH / 2 -
            RAMP_LENGTH / 2,
        ],
        {
          id: `${tunnel.id}-back-ramp`,
          rotation: [0, Math.PI, 0],
          color: "#b8a58a",
        }
      )
    ),
  ],
});
