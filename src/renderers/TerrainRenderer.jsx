// src/renderers/TerrainRenderer.jsx

import { useMemo, useEffect } from "react";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";

import { buildTerrain } from "../terrain/TerrainMesh";

export default function TerrainRenderer({
  terrain,
  sections = [],
}) {
  const mesh = useMemo(() => {
    if (!terrain) return null;

    return buildTerrain(terrain, sections);
  }, [terrain, sections]);

  useEffect(() => {
    return () => {
      mesh?.geometry.dispose();
    };
  }, [mesh]);

  const collider = useMemo(() => {
    if (!mesh) return null;

    return [
      mesh.vertices,
      mesh.indices,
    ];
  }, [mesh]);

  if (!mesh || !collider || collider[1].length === 0) {
    return null;
  }

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh
        geometry={mesh.geometry}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.9}
          metalness={0}
          side={2}
        />
      </mesh>

      <TrimeshCollider args={collider} />
    </RigidBody>
  );
}
