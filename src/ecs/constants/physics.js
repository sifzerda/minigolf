// src/ecs/constants/physics.js

export const BALL_RADIUS = 0.25;

export const PHYSICS = {
  gravity: -9.81,
  restitution: 0.15,

  stopSpeed: 0.12,
  stopSpin: 0.5,
  settleTime: 0.45,

  groundProbeDistance: 0.12,
  groundNormalMinY: 0.55,

  surfaces: {
    grass: {
      resistance: 0.8,
      friction: 0.8,
    },
    sand: {
      resistance: 3.5,
      friction: 1.2,
    },
    ice: {
      resistance: 0.08,
      friction: 0.05,
    },
    concrete: {
      resistance: 0.3,
      friction: 0.65,
    },
  },
};
