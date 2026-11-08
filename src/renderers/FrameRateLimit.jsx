// src/components/FrameRateLimit.jsx

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { renderActivity } from "../utils/renderActivity";

const MOVING_TYPES = new Set([
  "movingBarrier",
  "movingPlatform",
  "turnstile",
  "rotatingGate",
  "conveyorBelt",
  "windmill",
]);

export default function FrameRateLimit({
  fps = 45,
  idleFps = 10,
  course,
}) {
  const lastRender = useRef(0);
  const lastCameraPosition = useRef(null);
  const lastCameraRotation = useRef(null);
  const cameraActiveUntil = useRef(0);

  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  const hasAnimatedObstacles = course?.obstacles?.some((obstacle) => MOVING_TYPES.has(obstacle.type)) ?? false;

  useFrame(() => {
    const now = performance.now();

    const previousPosition = lastCameraPosition.current;
    const previousRotation = lastCameraRotation.current;

    const cameraChanged =
      !previousPosition ||
      !previousRotation ||
      camera.position.distanceToSquared(previousPosition) >
        0.000001 ||
      camera.quaternion.angleTo(previousRotation) > 0.0001;

    if (cameraChanged) {
      cameraActiveUntil.current = now + 300;
    }

    if (!previousPosition) {
      lastCameraPosition.current = camera.position.clone();
      lastCameraRotation.current = camera.quaternion.clone();
    } else {
      previousPosition.copy(camera.position);
      previousRotation.copy(camera.quaternion);
    }

    const ballMoving = renderActivity.isBallMoving();

    const active =
      ballMoving ||
      hasAnimatedObstacles ||
      now < cameraActiveUntil.current ||
      now < renderActivity.activeUntil;

    const targetFps = active ? fps : idleFps;
    const interval = 1000 / targetFps;

    if (now - lastRender.current < interval) {
      return;
    }

    lastRender.current = now;

    gl.render(scene, camera);
  }, 1);

  return null;
}
