// src/renderers/EnvironmentRenderer.jsx

import { useMemo } from "react";
import { getEnvironment } from "../ecs/constants/environments";
import LightingRenderer from "./LightingRenderer";
import AnimatedDecoration from "./AnimatedDecoration";

export default function EnvironmentRenderer({
  theme = "garden",
}) {
  const environment = getEnvironment(theme);

  const decorations = useMemo(() => {
    const count = 20;

    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = 18 + (index % 3) * 3;

      return [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ];
    });
  }, []);

  return (
    <>
      {/* Background */}
      <color
        attach="background"
        args={[environment.background]}
      />

      {/* Atmospheric fog */}
      <fog
        attach="fog"
        args={[
          environment.fog,
          environment.fogNear,
          environment.fogFar,
        ]}
      />

      {/* Environment-specific lighting */}
      <LightingRenderer theme={theme} />

      {/* Surrounding ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.6, 0]}
        receiveShadow
      >
        <planeGeometry args={[150, 150]} />

        <meshStandardMaterial
          color={environment.ground}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Animated environment decorations */}
      {decorations.map((position, index) => (
        <AnimatedDecoration
          key={index}
          index={index}
          type={environment.decorations}
          position={position}
        />
      ))}
    </>
  );
}
