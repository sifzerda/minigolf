// src/renderers/FollowCamera.jsx

import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRef } from "react";

import useGameStore from "../store/useGameStore";

export default function FollowCamera({ ballRef }) {
  const camera = useThree((state) => state.camera);

  const desiredPosition = useRef(new Vector3());
  const lookTarget = useRef(new Vector3());

  useFrame((_, delta) => {
    if (!ballRef.current) return;

    const position = ballRef.current.translation();

    const { aimAngle, cameraDistance } =
      useGameStore.getState();

    const distance = cameraDistance;

    desiredPosition.current.set(
      position.x + Math.sin(aimAngle) * distance,
      position.y + distance * 0.55,
      position.z + Math.cos(aimAngle) * distance
    );

    const smoothing = 1 - Math.exp(-5 * delta);

    camera.position.lerp(
      desiredPosition.current,
      smoothing
    );

    lookTarget.current.set(
      position.x,
      position.y + 0.25,
      position.z
    );

    camera.lookAt(lookTarget.current);
  });

  return null;
}
