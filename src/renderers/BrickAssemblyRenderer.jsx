// src/renderers/BrickAssemblyRenderer.jsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import {
  RigidBody,
  CuboidCollider,
  BallCollider,
  CylinderCollider,
  ConvexHullCollider,
  TrimeshCollider,
} from "@react-three/rapier";

const ORIGIN = [0, 0, 0];

const DEFAULT_COLOR = "#888888";
const DEFAULT_SEGMENTS = 32;

const EPSILON = 0.0001;

// ============================================================
// GEOMETRY — PYRAMID
// ============================================================

function makePyramid([width, height, length]) {
  const geometry = new THREE.CylinderGeometry(
    0,
    Math.SQRT1_2,
    1,
    4,
    1
  );

  geometry.rotateY(Math.PI / 4);
  geometry.scale(width, height, length);
  geometry.computeVertexNormals();

  return geometry;
}

// ============================================================
// GEOMETRY — WEDGE
// ============================================================

// The high edge faces negative Z.
// Geometry is centred vertically.

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

    // Sloping surface
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

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(vertices, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ============================================================
// GEOMETRY — BOX WITH CIRCULAR HOLES
// ============================================================

// Holes run through the box along local Z.
//
// Each hole:
// {
//   x: number,
//   y: number,
//   radius: number
// }
//
// x and y are relative to the box centre.

function makeBoxWithHoles(
  [width, height, length],
  holes = [],
  segments = DEFAULT_SEGMENTS
) {
  if (
    ![width, height, length].every(
      (value) =>
        Number.isFinite(value) && value > 0
    )
  ) {
    throw new Error(
      "boxWithHoles requires positive dimensions"
    );
  }

  if (
    !Number.isInteger(segments) ||
    segments < 8 ||
    segments > 128
  ) {
    throw new Error(
      "boxWithHoles segments must be 8–128"
    );
  }

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // ----------------------------------------------------------
  // OUTER RECTANGLE
  // ----------------------------------------------------------

  const outline = new THREE.Shape();

  // Clockwise outer contour.
  outline.moveTo(-halfWidth, -halfHeight);
  outline.lineTo(-halfWidth, halfHeight);
  outline.lineTo(halfWidth, halfHeight);
  outline.lineTo(halfWidth, -halfHeight);
  outline.closePath();

  // ----------------------------------------------------------
  // CIRCULAR OPENINGS
  // ----------------------------------------------------------

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];

    const x = hole.x ?? 0;
    const y = hole.y ?? 0;
    const radius = hole.radius;

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      throw new Error(
        `Invalid circular hole at index ${i}`
      );
    }

    // Hole must fit entirely inside the box.
    if (
      Math.abs(x) + radius >=
        halfWidth - EPSILON ||
      Math.abs(y) + radius >=
        halfHeight - EPSILON
    ) {
      throw new Error(
        `Circular hole ${i} extends outside the box`
      );
    }

    // Avoid intersecting or touching holes.
    for (let j = 0; j < i; j++) {
      const other = holes[j];

      const distance = Math.hypot(
        x - (other.x ?? 0),
        y - (other.y ?? 0)
      );

      if (
        distance <=
        radius + other.radius + EPSILON
      ) {
        throw new Error(
          `Circular holes ${j} and ${i} overlap`
        );
      }
    }

    const path = new THREE.Path();

    // Counterclockwise hole contour.
    path.absarc(
      x,
      y,
      radius,
      0,
      Math.PI * 2,
      false
    );

    outline.holes.push(path);
  }

  // ----------------------------------------------------------
  // EXTRUDE INTO A 3D BOX
  // ----------------------------------------------------------

  const geometry = new THREE.ExtrudeGeometry(
    outline,
    {
      depth: length,
      steps: 1,
      bevelEnabled: false,
      curveSegments: segments,
    }
  );

  // ExtrudeGeometry normally occupies Z = 0..length.
  // Centre it to match the other brick shapes.
  geometry.translate(
    0,
    0,
    -length / 2
  );

  geometry.computeBoundingSphere();

  return geometry;
}

// ============================================================
// CUSTOM GEOMETRY + COLLIDER DATA
// ============================================================

function buildCustomGeometry(
  shape,
  size,
  holes,
  segments
) {
  let geometry = null;

  if (shape === "pyramid") {
    geometry = makePyramid(size);
  } else if (shape === "wedge") {
    geometry = makeWedge(size);
  } else if (shape === "boxWithHoles") {
    geometry = makeBoxWithHoles(
      size,
      holes,
      segments
    );
  }

  if (!geometry) return null;

  const positionAttribute =
    geometry.getAttribute("position");

  const points = new Float32Array(
    positionAttribute.array
  );

  // Only concave geometry needs triangle indices.
  if (shape === "boxWithHoles") {
    const indices = geometry.index
      ? new Uint32Array(
          geometry.index.array
        )
      : Uint32Array.from(
          { length: positionAttribute.count },
          (_, index) => index
        );

    return {
      geometry,
      points,
      trimeshArgs: [points, indices],
    };
  }

  return {
    geometry,
    points,
  };
}

// ============================================================
// REUSABLE PRIMITIVE
// ============================================================

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

    holes = [],
    segments = DEFAULT_SEGMENTS,

    color = DEFAULT_COLOR,
    solid = true,
  } = part;

  const [width, boxHeight, length] = size;

  // ----------------------------------------------------------
  // GENERATED GEOMETRY
  // ----------------------------------------------------------

  const custom = useMemo(
    () =>
      buildCustomGeometry(
        shape,
        [width, boxHeight, length],
        holes,
        segments
      ),
    [
      shape,
      width,
      boxHeight,
      length,
      holes,
      segments,
    ]
  );

  // Dispose generated geometry when replaced
  // or when this primitive unmounts.
  useEffect(() => {
    return () => {
      custom?.geometry.dispose();
    };
  }, [custom]);

  // ----------------------------------------------------------
  // PHYSICS MATERIAL
  // ----------------------------------------------------------

  const physics = {
    friction: part.friction ?? friction,
    restitution:
      part.restitution ?? restitution,
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <group
      position={position}
      rotation={rotation}
    >
      {solid && (
        <>
          {/* Box */}

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

          {/* Sphere */}

          {shape === "sphere" && (
            <BallCollider
              args={[radius]}
              {...physics}
            />
          )}

          {/* Cylinder */}

          {shape === "cylinder" && (
            <CylinderCollider
              args={[
                height / 2,
                radius,
              ]}
              {...physics}
            />
          )}

          {/* Pyramid / Wedge */}

          {custom &&
            shape !== "boxWithHoles" && (
              <ConvexHullCollider
                args={[custom.points]}
                {...physics}
              />
            )}

          {/* Box with circular openings */}

          {custom &&
            shape === "boxWithHoles" && (
              <TrimeshCollider
                args={custom.trimeshArgs}
                {...physics}
              />
            )}
        </>
      )}

      {/* -------------------------------------------------- */}
      {/* VISIBLE GEOMETRY */}
      {/* -------------------------------------------------- */}

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
            args={[
              radius,
              radius,
              height,
              16,
            ]}
          />
        )}

        <meshStandardMaterial
          color={color}
          roughness={part.roughness ?? 0.85}
          metalness={part.metalness ?? 0}
          flatShading={
            shape === "pyramid" ||
            shape === "wedge"
          }
        />
      </mesh>
    </group>
  );
}

// ============================================================
// BRICK ASSEMBLY RENDERER
// ============================================================

export default function BrickAssemblyRenderer({
  entity,
}) {
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position ?? ORIGIN}
      rotation={entity.rotation ?? ORIGIN}
    >
      {(entity.parts ?? []).map(
        (part, index) => (
          <Primitive
            key={part.id ?? index}
            part={part}
            friction={
              entity.friction ?? 0.8
            }
            restitution={
              entity.restitution ?? 0.1
            }
          />
        )
      )}
    </RigidBody>
  );
}
