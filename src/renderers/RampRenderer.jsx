// src/renderers/RampRenderer.jsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";

const DEFAULT_COLOR = "#b8a58a";
const SEGMENTS = 32;
const EPSILON = 0.001;

// Cubic smoothstep.
function smoothstep(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);

  return x * x * (3 - 2 * x);
}

// Returns ramp height for normalized progress,
// where 0 = entrance and 1 = launch edge.
function getHeight(t, height) {
  const entranceEnd = 0.16;
  const lipStart = 0.84;

  const slope = height / (1 - entranceEnd / 2 - (1 - lipStart) / 2);

  if (t <= entranceEnd) {
    // Smoothly increase slope from zero.
    const u = t / entranceEnd;

    return (
      slope *
      entranceEnd *
      (u * u - (u * u * u) / 3) /
      2
    );
  }

  const entranceHeight =
    slope * entranceEnd / 3;

  if (t < lipStart) {
    return (
      entranceHeight +
      slope * (t - entranceEnd)
    );
  }

  // Gradually flatten the launch lip.
  const u = (t - lipStart) / (1 - lipStart);

  const lipHeight =
    entranceHeight +
    slope * (lipStart - entranceEnd);

  return (
    lipHeight +
    slope *
      (1 - lipStart) *
      (u - u * u + (u * u * u) / 3)
  );
}

// Smooth, normalized profile.
// This ensures the ramp begins at 0 and
// finishes at exactly the requested height.
function createHeightProfile(height) {
  const maximum = getHeight(1, height);

  return (t) => {
    if (maximum <= EPSILON) return 0;

    return (
      getHeight(t, height) *
      (height / maximum)
    );
  };
}

function createRampGeometry(width, height, length) {
  const halfWidth = width / 2;
  const halfLength = length / 2;

  const profile = createHeightProfile(height);

  const vertices = [];
  const indices = [];

  // Two top vertices per longitudinal segment.
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;

    // Entrance at positive Z.
    // Launch edge at negative Z.
    const z = halfLength - t * length;
    const y = profile(t);

    vertices.push(-halfWidth, y, z);
    vertices.push(halfWidth, y, z);
  }

  // Top surface.
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    indices.push(a, c, d);
    indices.push(a, d, b);
  }

  // Four bottom corners.
  const bottomStart = vertices.length / 3;

  vertices.push(
    -halfWidth, 0, halfLength,
    halfWidth, 0, halfLength,
    -halfWidth, 0, -halfLength,
    halfWidth, 0, -halfLength
  );

  const bottomA = bottomStart;
  const bottomB = bottomStart + 1;
  const bottomC = bottomStart + 2;
  const bottomD = bottomStart + 3;

  // Bottom face.
  indices.push(
    bottomA, bottomB, bottomD,
    bottomA, bottomD, bottomC
  );

  // Left and right sides.
  for (let i = 0; i < SEGMENTS; i++) {
    const leftA = i * 2;
    const leftB = (i + 1) * 2;

    const rightA = leftA + 1;
    const rightB = leftB + 1;

    const zA =
      halfLength - (i / SEGMENTS) * length;

    const zB =
      halfLength - ((i + 1) / SEGMENTS) * length;

    const sideBottomStart = vertices.length / 3;

    vertices.push(
      -halfWidth, 0, zA,
      -halfWidth, 0, zB,
      halfWidth, 0, zA,
      halfWidth, 0, zB
    );

    const blA = sideBottomStart;
    const blB = sideBottomStart + 1;
    const brA = sideBottomStart + 2;
    const brB = sideBottomStart + 3;

    // Left side.
    indices.push(leftA, blB, leftB);
    indices.push(leftA, blA, blB);

    // Right side.
    indices.push(rightA, rightB, brB);
    indices.push(rightA, brB, brA);
  }

  // Back vertical launch face.
  const lastLeft = SEGMENTS * 2;
  const lastRight = lastLeft + 1;

  indices.push(
    bottomC, bottomD, lastRight,
    bottomC, lastRight, lastLeft
  );

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      vertices,
      3
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export default function RampRenderer({ entity }) {
  const {
    position = [0, 0, 0],
    size = [2, 0.5, 2],
    angle = 0,
    surface = "concrete",
    color = DEFAULT_COLOR,
  } = entity;

  const [width, height, length] = size;

  const geometry = useMemo(
    () =>
      createRampGeometry(
        Math.max(width, EPSILON),
        Math.max(height, EPSILON),
        Math.max(length, EPSILON)
      ),
    [width, height, length]
  );

  const colliderData = useMemo(
    () => [
      new Float32Array(
        geometry.attributes.position.array
      ),
      new Uint32Array(
        geometry.index.array
      ),
    ],
    [geometry]
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[0, angle, 0]}
    >
      <TrimeshCollider
        args={colliderData}
        friction={
          surface === "ice" ? 0.05 : 0.85
        }
        restitution={0.05}
      />

      <mesh
        geometry={geometry}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}
