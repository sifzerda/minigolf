// src/renderers/WaterSplash.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useGamePaused } from "../context/GamePauseContext";

export default function WaterSplash({
  position,
  onComplete,
}) {
  const groupRef = useRef(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const paused = useGamePaused();

  useFrame((_, delta) => {
     if (paused || !groupRef.current) return;

    elapsedRef.current += delta;

    const progress = Math.min(
      elapsedRef.current / 0.6,
      1
    );

    groupRef.current.scale.setScalar(
      0.3 + progress * 2
    );

    groupRef.current.children.forEach((child) => {
      if (child.material) {
        child.material.opacity = 0.8 * (1 - progress);
      }
    });

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {[0.25, 0.4, 0.55].map((radius) => (
        <mesh
          key={radius}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry
            args={[radius, radius + 0.035, 32]}
          />
          <meshBasicMaterial
            color="#a5f3fc"
            transparent
            opacity={0.8}
            depthWrite={false}
            side={2}
          />
        </mesh>
      ))}
    </group>
  );
}
