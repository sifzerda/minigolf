// src/renderers/FloorRenderer.jsx

import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider, TrimeshCollider } from "@react-three/rapier";
import { subtractFloorRegions, polygonToGeometry, applyTerrainToFloor } from "../terrain/FloorGeometry";

// --------------------------------------------------
// Playable floor
// --------------------------------------------------

function FloorPiece({
  geometry,
  color,
  friction,
}) {
  const colliderData = useMemo(() => {
    if (!geometry) return null;
    const attr = geometry.getAttribute("position");
    if (!attr) return null;
    const vertices = Float32Array.from(attr.array);
    const indices = geometry.index
      ? Uint32Array.from(geometry.index.array)
      : Uint32Array.from({ length: attr.count }, (_, i) => i);
    return indices.length >= 3 ? [vertices, indices] : null;
  }, [geometry]);

  if (!colliderData) return null;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
    >
      <TrimeshCollider
        args={colliderData}
        friction={friction}
        restitution={0.1}
      />

      <mesh
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}

function FloorSection({
  section,
  hole,
  surfaces,
  terrain,
  preparedFeatures,
  heightSampler,
}) {
  // No global geometry cache: the floor owns and disposes its meshes.
  const geometries = useMemo(() => {
    return subtractFloorRegions(section, hole, surfaces)
      .map((polygon) => {
        const flat = polygonToGeometry(polygon);
        if (!flat) return null;
        return applyTerrainToFloor(
          flat,
          terrain,
          preparedFeatures,
          Math.max(0.15, section.terrainMaxEdge ?? 0.3),
          heightSampler
        );
      })
      .filter((geometry) =>
        geometry?.getAttribute("position")?.count > 0 &&
        geometry.index?.count > 0
      );
  }, [section, hole, surfaces, terrain, preparedFeatures, heightSampler]);

  useEffect(() => {
    return () => geometries.forEach((geometry) => geometry.dispose());
  }, [geometries]);

  return (
    <group position={[0, section.y ?? 0, 0]}>
      {geometries.map((geometry, index) => (
        <FloorPiece
          key={index}
          geometry={geometry}
          color={section.color ?? "#328b50"}
          friction={section.friction ?? 0.85}
        />
      ))}
    </group>
  );
}

function BoxSection({ section }) {
  const size = section.size ?? [
    section.width ?? 1,
    section.height ?? 0.2,
    section.length ?? 1,
  ];

  const position = section.position ?? [
    0,
    section.y ?? 0,
    0,
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={
        section.rotation ?? [0, 0, 0]
      }
    >
      <CuboidCollider
        args={size.map(
          (value) => value / 2
        )}
        friction={
          section.friction ?? 0.85
        }
        restitution={
          section.restitution ?? 0.1
        }
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />

        <meshStandardMaterial
          color={
            section.color ?? "#328b50"
          }
          roughness={0.95}
        />
      </mesh>
    </RigidBody>
  );
}

function CourseSection(props) {
  if (props.section.type === "floor") {
    return <FloorSection {...props} />;
  }

  return (
    <BoxSection section={props.section} />
  );
}


export default CourseSection;
