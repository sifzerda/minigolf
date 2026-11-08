// src/renderers/TerrainRenderer.jsx

import { useEffect, useMemo } from "react";
import {
  RigidBody,
  TrimeshCollider,
} from "@react-three/rapier";

import { buildTerrain } from "../terrain/TerrainBuilder.js";

export default function TerrainRenderer({ terrain }) {
  const meshData = useMemo(() => buildTerrain(terrain), [terrain]);

  useEffect(() => {
    return () => {
      meshData.geometry.dispose();
    };
  }, [meshData]);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      friction={0.8}
      restitution={0.1}
    >
      <TrimeshCollider
        args={[
          meshData.vertices,
          meshData.indices,
        ]}
      />

      <mesh
        geometry={meshData.geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={terrain.color ?? "#548a43"}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}
