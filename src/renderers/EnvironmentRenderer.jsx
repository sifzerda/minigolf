// src/renderers/EnvironmentRenderer.jsx

import { memo, useMemo } from "react";
import * as THREE from "three";

import { getEnvironment } from "../ecs/constants/environments";

import LightingRenderer from "./LightingRenderer";
import Decorations from "./Decorations";

// Shared geometry: created only once.
const GROUND_GEOMETRY = new THREE.PlaneGeometry(150, 150);

function EnvironmentRenderer({ theme = "garden" }) {
  const environment = useMemo(() => getEnvironment(theme),
    [theme]
  );

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

      {/* Environment lighting */}
      <LightingRenderer theme={theme} />

      {/* Shared surrounding ground */}
      <mesh
        geometry={GROUND_GEOMETRY}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.6, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={environment.ground}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Batched environmental decorations */}
      <Decorations
        type={environment.decorations}
      />
    </>
  );
}

export default memo(EnvironmentRenderer);
