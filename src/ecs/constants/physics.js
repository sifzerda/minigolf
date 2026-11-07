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

  rolling: {
    slipCorrection: 0.14,
    angularCorrection: 0.2,
    minRollingSpeed: 0.02,
    sleepSpeed: 0.035,
    sleepSpin: 0.12,
  },

  surfaces: {
    grass: {
      resistance: 0.8,
      friction: 0.8,
      rollingGrip: 0.85,
    },

    sand: {
      resistance: 3.5,
      friction: 1.2,
      rollingGrip: 0.95,
    },

    ice: {
      resistance: 0.08,
      friction: 0.05,
      rollingGrip: 0.08,
    },

    concrete: {
      resistance: 0.3,
      friction: 0.65,
      rollingGrip: 0.75,
    },
  },
};
