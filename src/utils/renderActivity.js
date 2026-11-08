// src/utils/renderActivity.js

// this connects ballRef to FrameRateLimit so FR can lower during idle ball and camera

export const renderActivity = {
  ballRef: null,
  activeUntil: 0,

  registerBall(ref) {
    this.ballRef = ref;
  },

  unregisterBall(ref) {
    if (this.ballRef === ref) {
      this.ballRef = null;
    }
  },

  wake(duration = 500) {
    this.activeUntil = Math.max(
      this.activeUntil,
      performance.now() + duration
    );
  },

  isBallMoving() {
    const ball = this.ballRef?.current;

    if (!ball) return false;
    if (ball.isSleeping()) return false;

    const velocity = ball.linvel();
    const angular = ball.angvel();

    const linearSpeedSquared =
      velocity.x ** 2 +
      velocity.y ** 2 +
      velocity.z ** 2;

    const angularSpeedSquared =
      angular.x ** 2 +
      angular.y ** 2 +
      angular.z ** 2;

    return (
      linearSpeedSquared > 0.0001 ||
      angularSpeedSquared > 0.0001
    );
  },
};
