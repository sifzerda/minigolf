// src/renderers/CourseGeometryRenderer.jsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import polygonClipping from "polygon-clipping";

import {
  RigidBody,
  CuboidCollider,
  TrimeshCollider,
} from "@react-three/rapier";

import {
  cachedGeometry,
  geometryKey,
} from "../terrain/GeometryCache";


import {
  triangulateXZ,
  upwardTriangleIndices,
  subdivideGeometryXZ,
} from "../terrain/PolygonMesh";

import { prepareTerrainFeatures } from "../terrain/TerrainFeatures";
import { useCachedGeometry } from "../terrain/useCachedGeometry";
import { createTerrainHeightSampler } from "../terrain/TerrainHeightSampler";
import { useTrimeshColliderData } from "../terrain/useTrimeshColliderData";

const EPSILON = 1e-6;
const CIRCLE_SEGMENTS = 64;

// --------------------------------------------------
// Polygon helpers
// --------------------------------------------------

// Coordinate normalization reduces almost-identical edges before clipping.
const CLIP_PRECISION = 1e5;
const MIN_AREA = 1e-7;

function closeRing(points) {
  if (!Array.isArray(points)) return [];
  const ring = [];
  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const x = Number(point[0]);
    const z = Number(point[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    const next = [
      Math.round(x * CLIP_PRECISION) / CLIP_PRECISION,
      Math.round(z * CLIP_PRECISION) / CLIP_PRECISION,
    ];
    const last = ring.at(-1);
    if (!last || last[0] !== next[0] || last[1] !== next[1]) ring.push(next);
  }
  if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
  if (ring.length < 3) return [];
  let twiceArea = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    twiceArea += a[0] * b[1] - b[0] * a[1];
  }
  if (Math.abs(twiceArea) < 2 * MIN_AREA) return [];
  return [...ring, [...ring[0]]];
}

function normalizePolygons(section) {
  if (Array.isArray(section.polygons)) {
    return section.polygons.map((polygon) => {
      if (!Array.isArray(polygon)) return [];
      const rings = polygon.map(closeRing);
      return rings[0]?.length >= 4 ? [rings[0], ...rings.slice(1).filter(r => r.length >= 4)] : [];
    }).filter(p => p.length);
  }
  const ring = closeRing(section.points);
  return ring.length ? [[ring]] : [];
}

function makeCircleRing(x, z, radius) {
  return closeRing(Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
    const angle = i * 2 * Math.PI / CIRCLE_SEGMENTS;
    return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius];
  }));
}

function makeWaterPolygon(surface, includeHoles = true) {
  let outer;
  if (surface.points?.length >= 3) {
    outer = closeRing(surface.points);
  } else if (surface.position && surface.size) {
    const [x, , z] = surface.position;
    const [width, length] = surface.size;
    outer = closeRing([
      [x - width / 2, z - length / 2],
      [x + width / 2, z - length / 2],
      [x + width / 2, z + length / 2],
      [x - width / 2, z + length / 2],
    ]);
  }
  if (!outer?.length) return null;
  const holes = (includeHoles ? (surface.holes ?? []) : []).map(h => closeRing(Array.isArray(h) ? h : h?.points))
    .filter(r => r.length >= 4);
  return [[outer, ...holes]];
}

function subtractFloorRegions(section, hole, surfaces = []) {
  const floor = normalizePolygons(section);
  if (!floor.length) return [];
  const cutouts = [];

  if (hole?.position && hole.radius > 0) {
    const [x, , z] = hole.position;
    const ring = makeCircleRing(x, z, hole.radius);
    if (ring.length) cutouts.push([[ring]]);
  }

  // Island floors are independent land; the lake surrounds, but does not erase, them.
  if (section.excludeWater !== true) {
    for (const surface of surfaces) {
      if ((surface.surface ?? surface.type) !== "water") continue;
      // Remove the full lake footprint from the outer floor.
      // The island is a separate section with excludeWater: true.
      const water = makeWaterPolygon(surface, false);
      if (water) cutouts.push(water);
    }
  }

  if (!cutouts.length) return floor;
  try {
    return polygonClipping.difference(floor, ...cutouts);
  } catch (error) {
    console.error(`Invalid floor clipping geometry in section ${section.id ?? "unnamed"}`, {
      floor, cutouts, error,
    });
    // Never return the uncut floor: it would create an invisible floor across the lake.
    throw error;
  }
}

// --------------------------------------------------
// Shared floor geometry
// --------------------------------------------------

function polygonToGeometry(polygon) {
  const triangles = triangulateXZ(polygon);

  if (!triangles.length) return null;

  const positions = [];
  const indices = [];
  const lookup = new Map();

  function vertex(point) {
    const key = `${point.x.toFixed(7)},${point.y.toFixed(7)}`;

    if (lookup.has(key)) {
      return lookup.get(key);
    }

    const index = positions.length / 3;

    positions.push(point.x, 0, point.y);
    lookup.set(key, index);

    return index;
  }

  for (const [a, b, c] of triangles) {
    upwardTriangleIndices(
      a,
      b,
      c,
      vertex(a),
      vertex(b),
      vertex(c),
      indices
    );
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function applyTerrainToFloor(
  geometry,
  terrain,
  preparedFeatures,
  maxEdge,
  heightSampler
) {
  if (!geometry) return null;

  if (!terrain?.features?.length) {
    return geometry;
  }

  const result = subdivideGeometryXZ(
    geometry,
    maxEdge,
    heightSampler.heightAt,
    {
      maxIterations: 20,
      maxTriangles: 250000,
    }
  );

  geometry.dispose();

  return result;
}

function createColliderData(geometry) {
  const position =
    geometry.getAttribute("position");

  const vertices = new Float32Array(
    position.array
  );

  const indices = geometry.index
    ? new Uint32Array(geometry.index.array)
    : Uint32Array.from(
      { length: position.count },
      (_, index) => index
    );

  return [vertices, indices];
}

// --------------------------------------------------
// Playable floor
// --------------------------------------------------

function FloorPiece({
  geometry,
  color,
  friction,
}) {
  const colliderData = useTrimeshColliderData(geometry);

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
  const geometries = useMemo(() => {
    const key = geometryKey(
      "floor",
      section,
      hole,
      surfaces,
      terrain
    );

    const polygons = subtractFloorRegions(
      section,
      hole,
      surfaces
    );

    return polygons
      .map((polygon, index) =>
        cachedGeometry(
          `${key}:${index}`,
          () => {
            const geometry = polygonToGeometry(polygon);

            if (!geometry) return null;

            return applyTerrainToFloor(
              geometry,
              terrain,
              preparedFeatures,
              Math.max(
                0.15,
                section.terrainMaxEdge ?? 0.3
              ),
              heightSampler
            );
          }
        )
      )
      .filter(
        (geometry) =>
          geometry &&
          geometry.getAttribute("position")?.count > 0 &&
          geometry.index?.count > 0
      );
  }, [
    section,
    hole,
    surfaces,
    terrain,
    preparedFeatures,
    heightSampler,
  ]);

  useEffect(() => {
    return () => {
      geometries.forEach((geometry) => {
        geometry?.dispose();
      });
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

// --------------------------------------------------
// Legacy terrain-following walls
// --------------------------------------------------

function createConformingWallGeometry(
  wall,
  terrain,
  preparedFeatures,
  heightSampler
) {
  const size = wall.size ?? [
    wall.length ?? 1,
    wall.height ?? 0.8,
    wall.thickness ?? 0.2,
  ];

  const [length, height, thickness] = size;

  const [cx, , cz] = wall.position ?? [0, 0, 0];

  const rotation = wall.rotation ?? [0, 0, 0];

  const quaternion = new THREE.Quaternion()
    .setFromEuler(
      new THREE.Euler(...rotation)
    );

  const segments = Math.max(
    1,
    Math.ceil(
      length /
      (wall.terrainMaxEdge ?? 0.2)
    )
  );

  const vertices = [];
  const indices = [];
  const skirt = 0.06;

  function elevation(localX, localZ) {
    const point = new THREE.Vector3(
      localX,
      0,
      localZ
    ).applyQuaternion(quaternion);

    const x = cx + point.x;
    const z = cz + point.z;

    return terrain?.features?.length
      ? heightSampler.heightAt(x, z)
      : 0;
  }

  function vertex(x, y, z) {
    const index = vertices.length / 3;
    vertices.push(x, y, z);
    return index;
  }

  function quad(a, b, c, d) {
    indices.push(
      a, b, c,
      a, c, d
    );
  }

  const slices = [];

  for (
    let i = 0;
    i <= segments;
    i++
  ) {
    const x =
      -length / 2 +
      (length * i) / segments;

    const frontZ = -thickness / 2;
    const backZ = thickness / 2;

    const frontY =
      elevation(x, frontZ);

    const backY =
      elevation(x, backZ);

    slices.push([
      vertex(
        x,
        -height / 2 + frontY - skirt,
        frontZ
      ),
      vertex(
        x,
        height / 2 + frontY,
        frontZ
      ),
      vertex(
        x,
        -height / 2 + backY - skirt,
        backZ
      ),
      vertex(
        x,
        height / 2 + backY,
        backZ
      ),
    ]);
  }

  for (
    let i = 0;
    i < segments;
    i++
  ) {
    const a = slices[i];
    const b = slices[i + 1];

    quad(a[0], b[0], b[1], a[1]);
    quad(a[2], a[3], b[3], b[2]);
    quad(a[1], b[1], b[3], a[3]);
    quad(a[0], a[2], b[2], b[0]);
  }

  const first = slices[0];
  const last = slices.at(-1);

  quad(
    first[0],
    first[1],
    first[3],
    first[2]
  );

  quad(
    last[0],
    last[2],
    last[3],
    last[1]
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

function CourseWall({
  wall,
  terrain,
  preparedFeatures,
  heightSampler,
}) {
  const key = geometryKey(
    "wall-v2",
    wall,
    terrain
  );

  const geometry = useCachedGeometry(
    key,
    () =>
      createConformingWallGeometry(
        wall,
        terrain,
        preparedFeatures,
        heightSampler
      )
  );
  const colliderData = useTrimeshColliderData(geometry);

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

function sampleAdaptiveBoundary(
  ring,
  heightSampler,
  {
    maxEdge = 1.2,
    minEdge = 0.15,
    heightTolerance = 0.025,
    maxDepth = 8,
  } = {}
) {
  if (!Array.isArray(ring) || ring.length < 3) {
    return [];
  }

  const points = [...ring];

  // Remove duplicated closing point.
  if (
    points.length > 1 &&
    Math.hypot(
      points[0][0] - points.at(-1)[0],
      points[0][1] - points.at(-1)[1]
    ) < 1e-7
  ) {
    points.pop();
  }

  if (points.length < 3) return [];

  const result = [];
  const heightAt = heightSampler.heightAt;

  function subdivide(a, b, depth) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const length = Math.hypot(dx, dz);

    const midpoint = [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
    ];

    const heightA = heightAt(a[0], a[1]);
    const heightB = heightAt(b[0], b[1]);
    const heightMid = heightAt(
      midpoint[0],
      midpoint[1]
    );

    const interpolatedHeight =
      (heightA + heightB) / 2;

    const heightError = Math.abs(
      heightMid - interpolatedHeight
    );

    const needsSubdivision =
      length > maxEdge ||
      (
        length > minEdge &&
        heightError > heightTolerance
      );

    if (needsSubdivision && depth < maxDepth) {
      subdivide(a, midpoint, depth + 1);
      subdivide(midpoint, b, depth + 1);
      return;
    }

    result.push(a);
  }

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];

    const length = Math.hypot(
      b[0] - a[0],
      b[1] - a[1]
    );

    if (length < 1e-7) continue;

    subdivide(a, b, 0);
  }

  return result;
}

// --------------------------------------------------
// Unified boundary mesh
// --------------------------------------------------

function createBoundaryGeometry(
  rings,
  style,
  terrain,
  preparedFeatures,
  adaptive = false,
  heightSampler
) {
  const positions = [];
  const indices = [];

  const height = Math.max(0.1, style.height ?? 0.6);
  const thickness = Math.max(0.05, style.thickness ?? 0.25);
  const maxEdge = Math.max(0.1, style.maxEdge ?? 0.35);
  const miterLimit = Math.max(1, style.miterLimit ?? 2.5);
  const skirt = style.skirt ?? 0.06;
  const yBase = style.y ?? 0;

  const halfThickness = thickness / 2;

  function elevation(x, z) {
    const value = heightSampler.heightAt(x, z);

    if (!Number.isFinite(value)) {
      throw new Error(
        `Invalid boundary elevation at ${x}, ${z}`
      );
    }

    return yBase + value;
  }

  function vertex(x, y, z) {
    const index = positions.length / 3;
    positions.push(x, y, z);
    return index;
  }

  function quad(a, b, c, d) {
    indices.push(
      a, b, c,
      a, c, d
    );
  }

  function normalize(x, z) {
    const length = Math.hypot(x, z);

    if (length < 1e-8) {
      return [0, 0];
    }

    return [x / length, z / length];
  }

  function sampleRing(ring) {
    if (!Array.isArray(ring) || ring.length < 3) {
      return [];
    }

    const points = [...ring];

    // Remove duplicated closing point.
    if (
      points.length > 1 &&
      Math.hypot(
        points[0][0] - points.at(-1)[0],
        points[0][1] - points.at(-1)[1]
      ) < 1e-7
    ) {
      points.pop();
    }

    if (points.length < 3) return [];

    const samples = [];

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];

      const dx = b[0] - a[0];
      const dz = b[1] - a[1];

      const length = Math.hypot(dx, dz);

      if (length < 1e-7) continue;

      const steps = Math.max(
        1,
        Math.ceil(length / maxEdge)
      );

      for (let j = 0; j < steps; j++) {
        const t = j / steps;

        samples.push([
          a[0] + dx * t,
          a[1] + dz * t,
        ]);
      }
    }

    return samples;
  }

  function offsetAt(previous, current, next) {
    const [ax, az] = normalize(
      current[0] - previous[0],
      current[1] - previous[1]
    );

    const [bx, bz] = normalize(
      next[0] - current[0],
      next[1] - current[1]
    );

    const n1x = -az;
    const n1z = ax;

    const n2x = -bz;
    const n2z = bx;

    const [mx, mz] = normalize(
      n1x + n2x,
      n1z + n2z
    );

    // Miter correction maintains the wall's
    // perpendicular thickness at bends.
    const dot = mx * n2x + mz * n2z;

    if (Math.abs(dot) < 1e-5) {
      return [
        n2x * halfThickness,
        n2z * halfThickness,
      ];
    }

    const scale = Math.min(
      halfThickness / dot,
      halfThickness * miterLimit
    );

    return [
      mx * scale,
      mz * scale,
    ];
  }

  for (const ring of rings) {
    const samples = adaptive
      ? sampleAdaptiveBoundary(
        ring,
        heightSampler,
        {
          maxEdge: style.colliderMaxEdge ?? 1.2,
          minEdge: style.colliderMinEdge ?? 0.15,
          heightTolerance:
            style.colliderHeightTolerance ?? 0.025,
          maxDepth: style.colliderMaxDepth ?? 8,
        }
      )
      : sampleRing(ring);

    if (samples.length < 3) continue;

    const sections = [];

    for (let i = 0; i < samples.length; i++) {
      const previous =
        samples[(i - 1 + samples.length) % samples.length];

      const current = samples[i];

      const next =
        samples[(i + 1) % samples.length];

      const [ox, oz] = offsetAt(
        previous,
        current,
        next
      );

      const outerX = current[0] + ox;
      const outerZ = current[1] + oz;

      const innerX = current[0] - ox;
      const innerZ = current[1] - oz;

      const outerY = elevation(outerX, outerZ);
      const innerY = elevation(innerX, innerZ);

      sections.push([
        vertex(
          outerX,
          outerY - skirt,
          outerZ
        ),
        vertex(
          outerX,
          outerY + height,
          outerZ
        ),
        vertex(
          innerX,
          innerY - skirt,
          innerZ
        ),
        vertex(
          innerX,
          innerY + height,
          innerZ
        ),
      ]);
    }

    for (let i = 0; i < sections.length; i++) {
      const a = sections[i];
      const b = sections[(i + 1) % sections.length];

      // Outer face
      quad(a[0], b[0], b[1], a[1]);

      // Inner face
      quad(a[2], a[3], b[3], b[2]);

      // Top face
      quad(a[1], b[1], b[3], a[3]);

      // Bottom face
      quad(a[0], a[2], b[2], b[0]);
    }
  }

  if (!indices.length) {
    return null;
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
  geometry.computeBoundingSphere();

  return geometry;
}

function simplifyCollisionRing(
  ring,
  {
    tolerance = 0.025,
    cornerAngle = 20,
  } = {}
) {
  if (!ring || ring.length < 5) {
    return ring;
  }

  const points = ring.slice();

  // Remove the duplicated closing point.
  if (
    Math.hypot(
      points[0][0] - points.at(-1)[0],
      points[0][1] - points.at(-1)[1]
    ) < 1e-7
  ) {
    points.pop();
  }

  if (points.length < 4) return ring;

  const angleLimit =
    cornerAngle * Math.PI / 180;

  function distanceToSegment(p, a, b) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];

    const lengthSq = dx * dx + dz * dz;

    if (lengthSq < 1e-12) {
      return Math.hypot(
        p[0] - a[0],
        p[1] - a[1]
      );
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        (
          (p[0] - a[0]) * dx +
          (p[1] - a[1]) * dz
        ) / lengthSq
      )
    );

    return Math.hypot(
      p[0] - a[0] - t * dx,
      p[1] - a[1] - t * dz
    );
  }

  function turningAngle(a, b, c) {
    const ux = b[0] - a[0];
    const uz = b[1] - a[1];
    const vx = c[0] - b[0];
    const vz = c[1] - b[1];

    return Math.abs(
      Math.atan2(
        ux * vz - uz * vx,
        ux * vx + uz * vz
      )
    );
  }

  let changed = true;

  while (changed && points.length > 3) {
    changed = false;

    for (let i = 0; i < points.length; i++) {
      const previous =
        points[(i - 1 + points.length) % points.length];

      const current = points[i];

      const next =
        points[(i + 1) % points.length];

      if (
        turningAngle(previous, current, next) >=
        angleLimit
      ) {
        continue;
      }

      if (
        distanceToSegment(
          current,
          previous,
          next
        ) > tolerance
      ) {
        continue;
      }

      points.splice(i, 1);
      changed = true;
      break;
    }
  }

  return [...points, [...points[0]]];
}

function simplifyCollisionRings(
  rings,
  options
) {
  return rings.map((ring) => simplifyCollisionRing(ring, options)
  );
}

function BoundaryMesh({
  rings,
  style,
  terrain,
  preparedFeatures,
  heightSampler,
}) {
  const visualKey = geometryKey(
    "boundary-visual-v5",
    rings,
    style,
    terrain
  );

  const visualGeometry = useCachedGeometry(
    visualKey,
    () =>
      createBoundaryGeometry(
        rings,
        {
          ...style,
          maxEdge: style.maxEdge ?? 0.3,
        },
        terrain,
        preparedFeatures,
        false,
        heightSampler
      )
  );

  const collisionRings = useMemo(
    () =>
      simplifyCollisionRings(rings, {
        tolerance: style.colliderTolerance ?? 0.025,
        cornerAngle: style.colliderCornerAngle ?? 20,
      }),
    [rings, style]
  );

  const collisionKey = geometryKey(
    "boundary-collider-v5",
    collisionRings,
    style,
    terrain
  );

  const collisionGeometry = useCachedGeometry(
    collisionKey,
    () =>
      createBoundaryGeometry(
        collisionRings,
        style,
        terrain,
        preparedFeatures,
        true,
        heightSampler
      )
  );

  const colliderData = useTrimeshColliderData(collisionGeometry);

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

// --------------------------------------------------
// Golf cup
// --------------------------------------------------

function GolfCup({ hole }) {
  const radius = hole.radius;
  const depth = hole.depth ?? 0.8;

  const [x, y, z] = hole.position;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y, z]}
    >
      <mesh
        position={[0, 0.008, 0]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        receiveShadow
      >
        <torusGeometry
          args={[
            radius,
            0.012,
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

      <mesh
        position={[
          0,
          -depth / 2,
          0,
        ]}
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

      <CuboidCollider
        args={[
          radius * 0.7,
          0.05,
          radius * 0.7,
        ]}
        position={[
          0,
          -depth,
          0,
        ]}
        friction={0.8}
        restitution={0}
      />

      <mesh
        position={[
          0,
          -depth,
          0,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <circleGeometry
          args={[radius, 48]}
        />

        <meshStandardMaterial
          color="#101010"
          roughness={1}
        />
      </mesh>
    </RigidBody>
  );
}

// --------------------------------------------------
// Main course renderer
// --------------------------------------------------

export default function CourseGeometryRenderer({
  course,
}) {
  const terrain = course?.terrain;

  const preparedFeatures = useMemo(
    () =>
      terrain
        ? prepareTerrainFeatures(terrain)
        : null,
    [terrain]
  );

  const heightSampler = useMemo(
    () =>
      createTerrainHeightSampler(
        terrain,
        preparedFeatures
      ),
    [terrain, preparedFeatures]
  );

  if (!course) return null;

  const sections =
    course.sections ?? [];

  const walls =
    course.walls ?? [];

  const surfaces =
    course.surfaces ?? [];

  return (
    <group>
      {sections.map((section, index) => (
        <CourseSection
          key={section.id ?? index}
          section={section}
          hole={
            section.type === "floor" &&
              section.excludeWater !== true
              ? course.hole
              : null
          }
          surfaces={surfaces}
          terrain={terrain}
          preparedFeatures={preparedFeatures}
          heightSampler={heightSampler}
        />
      ))}

      {course.boundaryRings?.length > 0 && (
        <BoundaryMesh
          rings={
            course.boundaryRings
          }
          style={
            course.wallStyle ?? {}
          }
          terrain={terrain}
          preparedFeatures={
            preparedFeatures
          }
          heightSampler={heightSampler}
        />
      )}

      {walls.map((wall, index) => (
        <CourseWall
          key={wall.id ?? index}
          wall={wall}
          terrain={terrain}
          preparedFeatures={
            preparedFeatures
          }
          heightSampler={heightSampler}
        />
      ))}

      {course.hole && (
        <GolfCup
          hole={{
            ...course.hole,
            position: [
              course.hole.position[0],
              (course.hole.position[1] ?? 0) +
              heightSampler.heightAt(
                course.hole.position[0],
                course.hole.position[2]
              ),
              course.hole.position[2],
            ],
          }}
        />
      )}

    </group>
  );
}
