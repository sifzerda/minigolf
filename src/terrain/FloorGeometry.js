// src/terrain/FloorGeometry.js
// Geometry-only functions extracted from FloorRenderer.
import * as THREE from "three";
import polygonClipping from "polygon-clipping";
import { triangulateXZ, upwardTriangleIndices, subdivideGeometryXZ } from "./TerrainMesh";

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

export function subtractFloorRegions(section, hole, surfaces = []) {
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

export function polygonToGeometry(polygon) {
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

export function applyTerrainToFloor(
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

