// src/renderers/FollowCamera.jsx

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils } from "three";
import { useGamePaused } from "../context/GamePauseContext";
import useGameStore from "../store/useGameStore";

const POSITION_EPSILON = 0.0001;
const TARGET_EPSILON = 0.0001;

function getCourseBounds(course) {
  const points = (course?.sections ?? [])
    .filter((section) => section.type === "floor")
    .flatMap((section) => section.points ?? []);

  if (!points.length) {
    return {
      centerX: 0,
      centerZ: 0,
      width: 8,
      length: 20,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const [x, z] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    length: maxZ - minZ,
  };
}

export default function FollowCamera({ ballRef, course }) {
  const { camera, size } = useThree();
  const paused = useGamePaused();
  const aimAngle = useGameStore((s) => s.aimAngle);
  const cameraDistance = useGameStore((s) => s.cameraDistance);
  const cameraMode = useGameStore((s) => s.cameraMode);

  const targetRef = useRef(new Vector3());
  const desiredPositionRef = useRef(new Vector3());
  const desiredTargetRef = useRef(new Vector3());

  const bounds = useMemo(
    () => getCourseBounds(course),
    [course]
  );

  useFrame((_, delta) => {
    if (paused) return;
    const ball = ballRef.current;
    if (!ball) return;

    const desiredPosition = desiredPositionRef.current;
    const desiredTarget = desiredTargetRef.current;

    if (cameraMode === "overview") {
      const aspect =
        size.width / Math.max(1, size.height);

      const verticalSpan = Math.max(
        bounds.length,
        bounds.width / aspect
      );

      const fov = MathUtils.degToRad(camera.fov);

      const height =
        (verticalSpan * 1.2) /
        (2 * Math.tan(fov / 2));

      desiredPosition.set(
        bounds.centerX,
        height,
        bounds.centerZ
      );

      desiredTarget.set(
        bounds.centerX,
        0,
        bounds.centerZ
      );
    } else {
      const position = ball.translation();

      const baseDistance = Math.max(
        bounds.width,
        bounds.length * 0.6,
        8
      );

      const distance =
        baseDistance * (cameraDistance / 8);

      desiredPosition.set(
        position.x + Math.sin(aimAngle) * distance,
        position.y + distance * 0.75,
        position.z + Math.cos(aimAngle) * distance
      );

      desiredTarget.set(
        position.x,
        position.y,
        position.z
      );
    }

    const positionChanged =
      camera.position.distanceToSquared(desiredPosition) >
      POSITION_EPSILON;

    const targetChanged =
      targetRef.current.distanceToSquared(desiredTarget) >
      TARGET_EPSILON;

    if (!positionChanged && !targetChanged) {
      return;
    }

    const smoothing =
      1 - Math.exp(-4 * Math.min(delta, 0.1));

    camera.position.lerp(
      desiredPosition,
      smoothing
    );

    targetRef.current.lerp(
      desiredTarget,
      smoothing
    );

    camera.lookAt(targetRef.current);
  });

  return null;
}
