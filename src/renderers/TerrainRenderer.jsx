// src/renderers/TerrainRenderer.jsx

import { useEffect, useMemo } from "react";
import {
  RigidBody,
  TrimeshCollider,
} from "@react-three/rapier";

import { buildTerrain } from "../terrain/TerrainBuilder.js";

export default function TerrainRenderer({
  terrain,
  sections = [],
}) {
  const meshData = useMemo(
    () => buildTerrain(terrain, sections),
    [terrain, sections]
  );

  useEffect(() => {
    return () => {
      meshData.geometry.dispose();
    };
  }, [meshData]);

  if (meshData.indices.length === 0) {
    return null;
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
    >
      <TrimeshCollider
        args={[
          meshData.vertices,
          meshData.indices,
        ]}
        friction={0.8}
        restitution={0.1}
      />

      <mesh
        geometry={meshData.geometry}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}
