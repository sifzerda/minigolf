// src/ecs/systems/HoleSystem.jsx

import { useFrame } from "@react-three/fiber";
import useGameStore from "../../store/useGameStore";

export default function HoleSystem({
  ballRef,
  hole,
}) {
  const completeHole = useGameStore(
    (s) => s.completeHole
  );

  useFrame(() => {
    if (!ballRef.current) return;

    const position = ballRef.current.translation();

    const dx = position.x - hole.position[0];
    const dz = position.z - hole.position[2];

    const distance = Math.hypot(dx, dz);

    if (distance < hole.radius * 0.65) {
      completeHole();
    }
  });

  return null;
}

