// src/renderers/BoundaryRenderer.jsx

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { useTerrainGeometry } from "../terrain/useTerrainGeometry";
import {
  createConformingWallGeometry,
  createBoundaryGeometry,
  simplifyCollisionRings,
} from "../terrain/BoundaryGeometry";

function CourseWall({
  wall,
  terrain,
  preparedFeatures,
  heightSampler,
}) {
  const { geometry, colliderData } = useTerrainGeometry(
    () => createConformingWallGeometry(wall, terrain, preparedFeatures, heightSampler),
    [wall, terrain, preparedFeatures, heightSampler]
  );

  if (!geometry || !colliderData) {
    return null;
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={
        wall.position ?? [0, 0, 0]
      }
      rotation={
        wall.rotation ?? [0, 0, 0]
      }
    >
      <TrimeshCollider
        args={colliderData}
        friction={
          wall.friction ?? 0.8
        }
        restitution={
          wall.restitution ?? 0.4
        }
      />

      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={
            wall.color ?? "#795548"
          }
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}

function BoundaryMesh({
  rings,
  style,
  terrain,
  preparedFeatures,
  heightSampler,
}) {
  const { geometry: visualGeometry } = useTerrainGeometry(
    () => createBoundaryGeometry(
      rings, { ...style, maxEdge: style.maxEdge ?? 0.3 },
      terrain, preparedFeatures, false, heightSampler
    ),
    [rings, style, terrain, preparedFeatures, heightSampler]
  );

  const collisionRings = useMemo(
    () =>
      simplifyCollisionRings(rings, {
        tolerance: style.colliderTolerance ?? 0.025,
        cornerAngle: style.colliderCornerAngle ?? 20,
      }),
    [rings, style]
  );

  const { colliderData } = useTerrainGeometry(
    () => createBoundaryGeometry(
      collisionRings, style, terrain, preparedFeatures, true, heightSampler
    ),
    [collisionRings, style, terrain, preparedFeatures, heightSampler]
  );

  if (!visualGeometry || !colliderData) {
    return null;
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
    >
      <TrimeshCollider
        args={colliderData}
        friction={style.friction ?? 0.8}
        restitution={
          style.restitution ?? 0.4
        }
      />

      <mesh
        geometry={visualGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={style.color ?? "#795548"}
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}


export { CourseWall, BoundaryMesh };
