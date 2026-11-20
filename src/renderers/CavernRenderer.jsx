// src/renderers/CavernRenderer.jsx

import { useMemo, useEffect } from "react";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import {
  BufferGeometry,
  BufferAttribute,
  DoubleSide,
} from "three";

// ============================================================
// DETERMINISTIC RANDOM
// ============================================================

function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ============================================================
// CAVERN GEOMETRY
// ============================================================

function createCavernGeometry({
  width,
  height,
  length,
  openingWidth,
  openingHeight,
  segments,
  rings,
  seed,
}) {
  const random = createRandom(seed);

  const vertices = [];
  const indices = [];

  const burial = 0.6;
  const stride = segments + 1;
  const layerSize = (rings + 1) * stride;

  const vertexIndex = (layer, ring, segment) =>
    layer * layerSize + ring * stride + segment;

  function quad(a, b, c, d) {
    indices.push(a, b, c, a, c, d);
  }

  // Outer rock surface and inner passage.
  for (let layer = 0; layer < 2; layer++) {
    const inner = layer === 1;

    const radiusX = (inner ? openingWidth : width) / 2;
    const radiusY = (inner ? openingHeight : height) + burial;

    for (let ring = 0; ring <= rings; ring++) {
      const z = (ring / rings - 0.5) * length;

      for (let segment = 0; segment <= segments; segment++) {
        const angle = (segment / segments) * Math.PI;

        const variation = inner
          ? 1
          : 0.85 + random() * 0.3;

        vertices.push(
          Math.cos(angle) * radiusX * variation,
          Math.sin(angle) * radiusY * variation - burial,
          z
        );
      }
    }
  }

  // Longitudinal surfaces.
  for (let ring = 0; ring < rings; ring++) {
    for (let s = 0; s < segments; s++) {
      const a = vertexIndex(0, ring, s);
      const b = a + 1;
      const c = b + stride;
      const d = a + stride;

      // Outer surface
      quad(a, b, c, d);

      // Inner surface
      quad(
        a + layerSize,
        d + layerSize,
        c + layerSize,
        b + layerSize
      );
    }
  }

  // Entrance and exit rock faces.
  for (let s = 0; s < segments; s++) {
    const a = vertexIndex(0, 0, s);
    const b = a + 1;

    quad(a, a + layerSize, b + layerSize, b);

    const c = vertexIndex(0, rings, s);
    const d = c + 1;

    quad(c, d, d + layerSize, c + layerSize);
  }

  // Underground bases of the rock walls.
  for (let ring = 0; ring < rings; ring++) {
    const a = vertexIndex(0, ring, 0);
    const b = a + stride;

    quad(a, b, b + layerSize, a + layerSize);

    const c = vertexIndex(0, ring, segments);
    const d = c + stride;

    quad(c, c + layerSize, d + layerSize, d);
  }

  const positions = new Float32Array(vertices);
  const triangles = new Uint32Array(indices);

  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new BufferAttribute(positions, 3)
  );

  geometry.setIndex(
    new BufferAttribute(triangles, 1)
  );

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return {
    geometry,
    collider: [positions, triangles],
  };
}

// ============================================================
// CAVERN RENDERER
// ============================================================

export default function CavernRenderer({ entity }) {
  const {
    position = [0, 0, 0],
    rotation = [0, 0, 0],

    size = [6, 3.6, 6.5],

    openingWidth = 1.9,
    openingHeight = 1.7,

    segments = 12,
    rings = 6,
    seed = 105,

    color = "#82796b",
    friction = 0.85,
    restitution = 0.2,
  } = entity;

  const [width, height, length] = size;

  const { geometry, collider } = useMemo(
    () =>
      createCavernGeometry({
        width,
        height,
        length,
        openingWidth,
        openingHeight,
        segments,
        rings,
        seed,
      }),
    [
      width,
      height,
      length,
      openingWidth,
      openingHeight,
      segments,
      rings,
      seed,
    ]
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={rotation}
    >
      <TrimeshCollider
        args={collider}
        friction={friction}
        restitution={restitution}
      />

      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={1}
          flatShading
          side={DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}
