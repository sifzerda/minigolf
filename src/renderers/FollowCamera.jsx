// src/renderers/FollowCamera.jsx

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, MathUtils } from "three";

import useGameStore from "../store/useGameStore";

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

  const xs = points.map((p) => p[0]);
  const zs = points.map((p) => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    length: maxZ - minZ,
  };
}

export default function FollowCamera({ ballRef, course }) {
  const { camera, size } = useThree();

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
    const ball = ballRef.current;
    if (!ball) return;

    const position = ball.translation();

    const desiredPosition = desiredPositionRef.current;
    const desiredTarget = desiredTargetRef.current;

    if (cameraMode === "overview") {
      const aspect = size.width / Math.max(1, size.height);

      const verticalSpan = Math.max(
        bounds.length,
        bounds.width / aspect
      );

      const fov = (camera.fov * Math.PI) / 180;

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

    const smoothing = 1 - Math.exp(-4 * delta);

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
