// src/renderers/BrickAssemblyRenderer.jsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import {
  RigidBody,
  CuboidCollider,
  BallCollider,
  CylinderCollider,
  ConvexHullCollider,
} from "@react-three/rapier";

const ORIGIN = [0, 0, 0];

// A square pyramid, centred around its midpoint.
function makePyramid([width, height, length]) {
  const geometry = new THREE.CylinderGeometry(0, Math.SQRT1_2, 1, 4, 1);

  geometry.rotateY(Math.PI / 4);
  geometry.scale(width, height, length);
  geometry.computeVertexNormals();

  return geometry;
}

// A triangular ramp. The high edge faces -Z.
function makeWedge([width, height, length]) {
  const w = width / 2;
  const h = height / 2;
  const l = length / 2;

  const vertices = new Float32Array([
    -w, -h,  l,
     w, -h,  l,
    -w, -h, -l,
     w, -h, -l,
    -w,  h, -l,
     w,  h, -l,
  ]);

  const indices = [
    // Bottom
    0, 3, 1,
    0, 2, 3,

    // Sloping top
    0, 1, 5,
    0, 5, 4,

    // Back
    2, 4, 5,
    2, 5, 3,

    // Left
    0, 4, 2,

    // Right
    1, 3, 5,
  ];

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function Primitive({
  part,
  friction = 0.8,
  restitution = 0.1,
}) {
  const {
    shape = "box",
    size = [1, 1, 1],
    radius = 0.5,
    height = 1,
    position = ORIGIN,
    rotation = ORIGIN,
    color = "#888888",
    solid = true,
  } = part;

  const [width, boxHeight, length] = size;

  // Only custom shapes need generated geometry.
  const custom = useMemo(() => {
    let geometry = null;

    if (shape === "pyramid") {
      geometry = makePyramid([
        width, boxHeight, length,
      ]);
    }

    if (shape === "wedge") {
      geometry = makeWedge([
        width, boxHeight, length,
      ]);
    }

    if (!geometry) return null;

    return {
      geometry,
      points: new Float32Array(
        geometry.getAttribute("position").array
      ),
    };
  }, [shape, width, boxHeight, length]);

  useEffect(() => {
    return () => custom?.geometry.dispose();
  }, [custom]);

  const physics = {
    friction: part.friction ?? friction,
    restitution: part.restitution ?? restitution,
  };

  return (
    <group position={position} rotation={rotation}>
      {solid && (
        <>
          {shape === "box" && (
            <CuboidCollider
              args={[
                width / 2,
                boxHeight / 2,
                length / 2,
              ]}
              {...physics}
            />
          )}

          {shape === "sphere" && (
            <BallCollider
              args={[radius]}
              {...physics}
            />
          )}

          {shape === "cylinder" && (
            <CylinderCollider
              args={[height / 2, radius]}
              {...physics}
            />
          )}

          {custom && (
            <ConvexHullCollider
              args={[custom.points]}
              {...physics}
            />
          )}
        </>
      )}

      <mesh
        geometry={custom?.geometry}
        castShadow
        receiveShadow
      >
        {shape === "box" && (
          <boxGeometry args={size} />
        )}

        {shape === "sphere" && (
          <sphereGeometry
            args={[radius, 16, 12]}
          />
        )}

        {shape === "cylinder" && (
          <cylinderGeometry
            args={[radius, radius, height, 16]}
          />
        )}

        <meshStandardMaterial
          color={color}
          roughness={part.roughness ?? 0.85}
          metalness={part.metalness ?? 0}
          flatShading={
            shape === "pyramid" || shape === "wedge"
          }
        />
      </mesh>
    </group>
  );
}

export default function BrickAssemblyRenderer({ entity }) {
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position ?? ORIGIN}
      rotation={entity.rotation ?? ORIGIN}
    >
      {(entity.parts ?? []).map((part, index) => (
        <Primitive
          key={part.id ?? index}
          part={part}
          friction={entity.friction ?? 0.8}
          restitution={entity.restitution ?? 0.1}
        />
      ))}
    </RigidBody>
  );
}
