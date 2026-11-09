// src/utils/renderActivity.js

// this connects ballRef to FrameRateLimit so FR can lower during idle ball and camera

let ballRef = null;
let activeUntil = 0;

function registerBall(ref) {
  ballRef = ref;
}

function unregisterBall(ref) {
  if (ballRef === ref) {
    ballRef = null;
  }
}

function wake(duration = 500) {
  activeUntil = Math.max(activeUntil, performance.now() + duration);
}

function isBallMoving() {
  const ball = ballRef?.current;

  if (!ball || ball.isSleeping()) {
    return false;
  }

  const velocity = ball.linvel();
  const angular = ball.angvel();

  const linearSpeedSquared = velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2;
  const angularSpeedSquared = angular.x ** 2 + angular.y ** 2 + angular.z ** 2;

  return (linearSpeedSquared > 0.0001 || angularSpeedSquared > 0.0001);
}

export const renderActivity = {
  registerBall,
  unregisterBall,
  wake,
  isBallMoving,

  get ballRef() {
    return ballRef;
  },

  get activeUntil() {
    return activeUntil;
  },
};
