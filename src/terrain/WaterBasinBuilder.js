// src/terrain/WaterBasinBuilder.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";

const EPS = 1e-5;
const PRECISION = 1e5;

function closeRing(points) {
  if (!Array.isArray(points)) return [];

  const ring = [];

  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }

    const x = Number(point[0]);
    const z = Number(point[1]);

    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      continue;
    }

    const p = [
      Math.round(x * PRECISION) / PRECISION,
      Math.round(z * PRECISION) / PRECISION,
    ];

    const last = ring.at(-1);

    if (
      !last ||
      last[0] !== p[0] ||
      last[1] !== p[1]
    ) {
      ring.push(p);
    }
  }

  if (
    ring.length > 1 &&
    ring[0][0] === ring.at(-1)[0] &&
    ring[0][1] === ring.at(-1)[1]
  ) {
    ring.pop();
  }

  if (ring.length < 3) return [];

  let area = 0;

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];

    area += a[0] * b[1] - b[0] * a[1];
  }

  if (Math.abs(area) < EPS * EPS) {
    return [];
  }

  return [...ring, [...ring[0]]];
}

function waterPolygon(surface) {
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

  if (!outer?.length) return [];

  const holes = (surface.holes ?? [])
    .map((hole) =>
      closeRing(
        Array.isArray(hole)
          ? hole
          : hole?.points
      )
    )
    .filter((ring) => ring.length >= 4);

  return [[outer, ...holes]];
}

function floorPolygons(sections = []) {
  const result = [];

  for (const section of sections) {
    if (section.type !== "floor") continue;

    if (Array.isArray(section.polygons)) {
      for (const polygon of section.polygons) {
        if (!Array.isArray(polygon)) continue;

        const rings = polygon.map(closeRing);

        if (rings[0]?.length >= 4) {
          result.push([
            rings[0],
            ...rings
              .slice(1)
              .filter((ring) => ring.length >= 4),
          ]);
        }
      }
    } else {
      const ring = closeRing(section.points);

      if (ring.length >= 4) {
        result.push([ring]);
      }
    }
  }

  return result;
}

function createHorizontalGeometry(polygons, y) {
  const positions = [];
  const indices = [];

  for (const polygon of polygons) {
    const toVectors = (ring) =>
      ring
        .slice(0, -1)
        .map(
          ([x, z]) => new THREE.Vector2(x, z)
        );

    const outer = toVectors(polygon[0]);
    const holes = polygon
      .slice(1)
      .map(toVectors);

    const triangles =
      THREE.ShapeUtils.triangulateShape(
        outer,
        holes
      );

    const points = [
      ...outer,
      ...holes.flat(),
    ];

    const offset = positions.length / 3;

    for (const point of points) {
      positions.push(
        point.x,
        y,
        point.y
      );
    }

    for (const [a, b, c] of triangles) {
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
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
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

  if (Math.abs(cross) > EPS) {
    return false;
  }

  const dot =
    (point[0] - a[0]) * dx +
    (point[1] - a[1]) * dz;

  return (
    dot >= -EPS &&
    dot <= dx * dx + dz * dz + EPS
  );
}

function isBoundaryEdge(a, b, sections) {
  for (const polygon of floorPolygons(sections)) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        if (
          isOnSegment(a, ring[i], ring[i + 1]) &&
          isOnSegment(b, ring[i], ring[i + 1])
        ) {
          return true;
        }
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

        // Leave water open at the course perimeter.
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
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function buildWaterBasin(
  surface,
  sections = []
) {
  const water = waterPolygon(surface);
  const floors = floorPolygons(sections);

  const floorY = surface.position?.[1] ?? 0;

  const depth = Math.max(
    0.3,
    surface.depth ?? 0.65
  );

  const bottomY = floorY - depth;
  const waterY = floorY - depth * 0.35;

  let clipped = [];

  if (water.length && floors.length) {
    try {
      // The outer floor should be defined before
      // water subtraction.
      //
      // Water holes preserve islands.
      const playable =
        polygonClipping.union(...floors);

      clipped = polygonClipping.intersection(
        water,
        playable
      );
    } catch (error) {
      console.error(
        `Water basin clipping failed: ${
          surface.id ?? "unnamed"
        }`,
        {
          water,
          floors,
          error,
        }
      );

      throw error;
    }
  }

  return {
    polygons: clipped,
    bottomY,
    waterY,
    floorY,

    bottomGeometry:
      createHorizontalGeometry(
        clipped,
        bottomY
      ),

    waterGeometry:
      createHorizontalGeometry(
        clipped,
        waterY
      ),

    wallGeometry:
      createWallGeometry(
        clipped,
        sections,
        floorY,
        bottomY
      ),
  };
}
