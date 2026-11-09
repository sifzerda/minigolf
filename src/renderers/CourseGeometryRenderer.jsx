// src/renderers/CourseGeometryRenderer.jsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import polygonClipping from "polygon-clipping";

import {
  RigidBody,
  CuboidCollider,
  TrimeshCollider,
} from "@react-three/rapier";

const EPSILON = 1e-6;
const CIRCLE_SEGMENTS = 64;

function closeRing(points) {
  if (!Array.isArray(points) || points.length < 3) {
    return [];
  }

  const ring = points.map(([x, z]) => [x, z]);

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (
    Math.abs(first[0] - last[0]) > EPSILON ||
    Math.abs(first[1] - last[1]) > EPSILON
  ) {
    ring.push([...first]);
  }

  return ring;
}

function makeCircleRing(x, z, radius) {
  const points = [];

  for (let i = 0; i < CIRCLE_SEGMENTS; i++) {
    const angle =
      (i / CIRCLE_SEGMENTS) * Math.PI * 2;

    points.push([
      x + Math.cos(angle) * radius,
      z + Math.sin(angle) * radius,
    ]);
  }

  return closeRing(points);
}

function makeWaterRing(surface) {
  // Irregular water regions.
  if (
    Array.isArray(surface.points) &&
    surface.points.length >= 3
  ) {
    return closeRing(surface.points);
  }

  // Rectangular water regions.
  if (!surface.position || !surface.size) {
    return [];
  }

  const [x, , z] = surface.position;
  const [width, length] = surface.size;

  const hw = width / 2;
  const hl = length / 2;

  return closeRing([
    [x - hw, z - hl],
    [x + hw, z - hl],
    [x + hw, z + hl],
    [x - hw, z + hl],
  ]);
}

function getWaterSurfaces(surfaces) {
  return surfaces.filter(
    (surface) =>
      (surface.surface ?? surface.type) === "water"
  );
}

function subtractFloorRegions(
  section,
  hole,
  surfaces
) {
  const floorRing = closeRing(section.points);

  if (floorRing.length < 4) {
    return [];
  }

  const floor = [[floorRing]];
  const cutouts = [];

  // Golf cup opening.
  if (hole) {
    const [x, , z] = hole.position;

    cutouts.push([
      [makeCircleRing(x, z, hole.radius)],
    ]);
  }

  // Water openings.
  for (const water of getWaterSurfaces(surfaces)) {
    const ring = makeWaterRing(water);

    if (ring.length < 4) {
      continue;
    }

    cutouts.push([[ring]]);
  }

  if (cutouts.length === 0) {
    return floor;
  }

  return polygonClipping.difference(
    floor,
    ...cutouts
  );
}

function polygonToGeometry(polygon) {
  const toVectors = (ring) =>
    ring.slice(0, -1).map(
      ([x, z]) => new THREE.Vector2(x, z)
    );

  const contour = toVectors(polygon[0]);
  const holes = polygon.slice(1).map(toVectors);

  if (contour.length < 3) {
    return null;
  }

  const triangles =
    THREE.ShapeUtils.triangulateShape(
      contour,
      holes
    );

  const points = [
    ...contour,
    ...holes.flat(),
  ];

  const positions = [];
  const indices = [];

  for (const point of points) {
    positions.push(
      point.x,
      0,
      point.y
    );
  }

  for (const [a, b, c] of triangles) {
    const p0 = points[a];
    const p1 = points[b];
    const p2 = points[c];

    const area =
      (p1.x - p0.x) * (p2.y - p0.y) -
      (p1.y - p0.y) * (p2.x - p0.x);

    if (Math.abs(area) < EPSILON) {
      continue;
    }

    // Correct upward-facing XZ winding.
    if (area < 0) {
      indices.push(a, b, c);
    } else {
      indices.push(a, c, b);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createFloorGeometries(
  section,
  hole,
  surfaces
) {
  const polygons = subtractFloorRegions(
    section,
    hole,
    surfaces
  );

  return polygons
    .map(polygonToGeometry)
    .filter(Boolean);
}

function createColliderData(geometry) {
  const position =
    geometry.getAttribute("position");

  const vertices = new Float32Array(
    position.array
  );

  const indices = geometry.index
    ? new Uint32Array(
        geometry.index.array
      )
    : new Uint32Array(
        Array.from(
          { length: position.count },
          (_, index) => index
        )
      );

  return [vertices, indices];
}

function FloorPiece({
  geometry,
  color,
  friction,
}) {
  const colliderData = useMemo(
    () => createColliderData(geometry),
    [geometry]
  );

  if (colliderData[1].length === 0) {
    return null;
  }

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
}) {
  const geometries = useMemo(
    () =>
      createFloorGeometries(
        section,
        hole,
        surfaces
      ),
    [section, hole, surfaces]
  );

  useEffect(() => {
    return () => {
      geometries.forEach(
        (geometry) => geometry.dispose()
      );
    };
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
      rotation={section.rotation ?? [0, 0, 0]}
    >
      <CuboidCollider
        args={size.map((value) => value / 2)}
        friction={section.friction ?? 0.85}
        restitution={section.restitution ?? 0.1}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />

        <meshStandardMaterial
          color={section.color ?? "#328b50"}
          roughness={0.95}
        />
      </mesh>
    </RigidBody>
  );
}

function CourseSection({
  section,
  hole,
  surfaces,
}) {
  if (section.type === "floor") {
    return (
      <FloorSection
        section={section}
        hole={hole}
        surfaces={surfaces}
      />
    );
  }

  return <BoxSection section={section} />;
}

function CourseWall({ wall }) {
  const size = wall.size ?? [
    wall.length ?? 1,
    wall.height ?? 0.8,
    wall.thickness ?? 0.2,
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={wall.position ?? [0, 0, 0]}
      rotation={wall.rotation ?? [0, 0, 0]}
    >
      <CuboidCollider
        args={size.map((value) => value / 2)}
        friction={wall.friction ?? 0.8}
        restitution={wall.restitution ?? 0.4}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />

        <meshStandardMaterial
          color={wall.color ?? "#795548"}
          roughness={0.85}
        />
      </mesh>
    </RigidBody>
  );
}


function GolfCup({ hole }) {
  const radius = hole.radius;
  const depth = hole.depth ?? 0.8;

  const [x, y, z] = hole.position;

  // Silver rim appearance
  const rimThickness = 0.012;
  const rimHeight = 0.008;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y, z]}
    >
      {/* Thin metallic silver rim */}
      <mesh
        position={[0, rimHeight, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <torusGeometry
          args={[
            radius,
            rimThickness,
            8,
            64,
          ]}
        />

        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.85}
          roughness={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interior cup wall */}
      <mesh
        position={[0, -depth / 2, 0]}
        receiveShadow
      >
        <cylinderGeometry
          args={[
            radius,
            radius,
            depth,
            48,
            1,
            true,
          ]}
        />

        <meshStandardMaterial
          color="#171717"
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>

      {/* Cup bottom collider */}
      <CuboidCollider
        args={[
          radius * 0.7,
          0.05,
          radius * 0.7,
        ]}
        position={[0, -depth, 0]}
        friction={0.8}
        restitution={0}
      />

      {/* Cup bottom */}
      <mesh
        position={[0, -depth, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[radius, 48]} />

        <meshStandardMaterial
          color="#101010"
          roughness={1}
        />
      </mesh>
    </RigidBody>
  );
}


export default function CourseGeometryRenderer({
  course,
}) {
  if (!course) return null;

  const sections = course.sections ?? [];
  const walls = course.walls ?? [];
  const surfaces = course.surfaces ?? [];

  return (
    <group>
      {sections.map((section, index) => (
        <CourseSection
          key={section.id ?? index}
          section={section}
          hole={
            section.type === "floor" && section.id === "main-floor"
              ? course.hole
              : null
          }
          surfaces={surfaces}
        />
      ))}

      {walls.map((wall, index) => (
        <CourseWall
          key={wall.id ?? index}
          wall={wall}
        />
      ))}

      {course.hole && (
        <GolfCup hole={course.hole} />
      )}
    </group>
  );
}
