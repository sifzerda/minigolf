// src/terrain/WaterBasinBuilder.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";

const EPS = 1e-5;

function closeRing(points) {
  const result = points.map(([x, z]) => [x, z]);

  if (result.length < 3) return [];

  const first = result[0];
  const last = result[result.length - 1];

  if (
    Math.abs(first[0] - last[0]) > EPS ||
    Math.abs(first[1] - last[1]) > EPS
  ) {
    result.push([...first]);
  }

  return result;
}

function waterPolygon(surface) {
  if (surface.points?.length >= 3) {
    return [[closeRing(surface.points)]];
  }

  const [x, , z] = surface.position;
  const [width, length] = surface.size;

  return [[closeRing([
    [x - width / 2, z - length / 2],
    [x + width / 2, z - length / 2],
    [x + width / 2, z + length / 2],
    [x - width / 2, z + length / 2],
  ])]];
}

function floorPolygons(sections) {
  return sections
    .filter(
      (section) =>
        section.type === "floor" &&
        section.points?.length >= 3
    )
    .map((section) => [
      [closeRing(section.points)],
    ]);
}

function createHorizontalGeometry(polygons, y) {
  const positions = [];
  const indices = [];

  for (const polygon of polygons) {
    const toVectors = (ring) =>
      ring.slice(0, -1).map(
        ([x, z]) => new THREE.Vector2(x, z)
      );

    const outer = toVectors(polygon[0]);
    const holes = polygon.slice(1).map(toVectors);

    const triangles =
      THREE.ShapeUtils.triangulateShape(
        outer,
        holes
      );

    const points = [...outer, ...holes.flat()];
    const offset = positions.length / 3;

    for (const point of points) {
      positions.push(point.x, y, point.y);
    }

    for (const [a, b, c] of triangles) {
      // Upward-facing XZ triangles.
      const p0 = points[a];
      const p1 = points[b];
      const p2 = points[c];

      const cross =
        (p1.x - p0.x) * (p2.y - p0.y) -
        (p1.y - p0.y) * (p2.x - p0.x);

      if (cross < 0) {
        indices.push(
          offset + a,
          offset + b,
          offset + c
        );
      } else {
        indices.push(
          offset + a,
          offset + c,
          offset + b
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function isOnSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];

  const cross =
    (point[0] - a[0]) * dz -
    (point[1] - a[1]) * dx;

  if (Math.abs(cross) > EPS) return false;

  const dot =
    (point[0] - a[0]) * dx +
    (point[1] - a[1]) * dz;

  return (
    dot >= -EPS &&
    dot <= dx * dx + dz * dz + EPS
  );
}

function isBoundaryEdge(a, b, sections) {
  for (const section of sections) {
    if (
      section.type !== "floor" ||
      !section.points
    ) {
      continue;
    }

    const ring = closeRing(section.points);

    for (let i = 0; i < ring.length - 1; i++) {
      const p = ring[i];
      const q = ring[i + 1];

      if (
        isOnSegment(a, p, q) &&
        isOnSegment(b, p, q)
      ) {
        return true;
      }
    }
  }

  return false;
}

function createWallGeometry(
  polygons,
  sections,
  topY,
  bottomY
) {
  const positions = [];
  const indices = [];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i];
        const b = ring[i + 1];

        // Open water at the course perimeter.
        if (isBoundaryEdge(a, b, sections)) {
          continue;
        }

        const offset = positions.length / 3;

        positions.push(
          a[0], topY, a[1],
          b[0], topY, b[1],
          b[0], bottomY, b[1],
          a[0], bottomY, a[1]
        );

        indices.push(
          offset,
          offset + 1,
          offset + 2,
          offset,
          offset + 2,
          offset + 3
        );
      }
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function buildWaterBasin(
  surface,
  sections
) {
  const floors = floorPolygons(sections);

  const water = waterPolygon(surface);

  const playable = floors.length
    ? polygonClipping.union(...floors)
    : [];

  const clipped = playable.length
    ? polygonClipping.intersection(
        water,
        playable
      )
    : [];

  const floorY = surface.position?.[1] ?? 0;
  const depth = Math.max(
    0.3,
    surface.depth ?? 0.65
  );

  const bottomY = floorY - depth;
  const waterY = floorY - depth * 0.35;

  return {
    polygons: clipped,
    bottomY,
    waterY,
    floorY,

    bottomGeometry: createHorizontalGeometry(
      clipped,
      bottomY
    ),

    waterGeometry: createHorizontalGeometry(
      clipped,
      waterY
    ),

    wallGeometry: createWallGeometry(
      clipped,
      sections,
      floorY,
      bottomY
    ),
  };
}
