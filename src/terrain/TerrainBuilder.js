// src/terrain/TerrainBuilder.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";

import {
  getTerrainHeight,
  prepareTerrainFeatures,
} from "./TerrainFeatures";

import { getTerrainSurface } from "./TerrainRegions";
import { getTerrainMaterial } from "./TerrainMaterials";

function closeRing(points) {
  if (points.length < 3) return [];

  const ring = points.map(([x, z]) => [x, z]);

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  return ring;
}

function getExteriorPolygons(width, length, sections) {
  const halfWidth = width / 2;
  const halfLength = length / 2;

  const boundary = [[closeRing([
    [-halfWidth, -halfLength],
    [halfWidth, -halfLength],
    [halfWidth, halfLength],
    [-halfWidth, halfLength],
  ])]];

  const exclusions = sections
    .filter(
      (section) =>
        section.type === "floor" &&
        Array.isArray(section.points) &&
        section.points.length >= 3
    )
    .map((section) => [
      [closeRing(section.points)],
    ]);

  if (exclusions.length === 0) {
    return boundary;
  }

  return polygonClipping.difference(
    boundary,
    ...exclusions
  );
}

function triangulatePolygon(polygon) {
  const toVectors = (ring) =>
    ring.slice(0, -1).map(
      ([x, z]) => new THREE.Vector2(x, z)
    );

  const contour = toVectors(polygon[0]);
  const holes = polygon.slice(1).map(toVectors);

  if (contour.length < 3) return [];

  const triangles = THREE.ShapeUtils.triangulateShape(
    contour,
    holes
  );

  const points = [
    ...contour,
    ...holes.flat(),
  ];

  return triangles.map(([a, b, c]) => [
    points[a],
    points[b],
    points[c],
  ]);
}

function subdivideTriangle(a, b, c, maxEdge, emit) {
  const stack = [[a, b, c]];
  const maxEdgeSquared = maxEdge * maxEdge;

  while (stack.length > 0) {
    const [p0, p1, p2] = stack.pop();

    const edges = [
      [p0, p1, p2],
      [p1, p2, p0],
      [p2, p0, p1],
    ];

    let longest = edges[0];
    let longestLength = -1;

    for (const edge of edges) {
      const dx = edge[0].x - edge[1].x;
      const dz = edge[0].y - edge[1].y;
      const length = dx * dx + dz * dz;

      if (length > longestLength) {
        longestLength = length;
        longest = edge;
      }
    }

    if (longestLength <= maxEdgeSquared) {
      emit(p0, p1, p2);
      continue;
    }

    const [start, end, opposite] = longest;

    const midpoint = new THREE.Vector2(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2
    );

    stack.push(
      [start, midpoint, opposite],
      [midpoint, end, opposite]
    );
  }
}

export function buildTerrain(terrain, floorSections = []) {
  if (!terrain) {
    throw new Error("Terrain configuration is required");
  }

  const {
    width = 30,
    length = 40,
    resolution = 64,
  } = terrain;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length) ||
    !Number.isFinite(resolution) ||
    width <= 0 ||
    length <= 0 ||
    resolution < 2
  ) {
    throw new Error("Invalid terrain dimensions");
  }

  const segments = Math.max(2, Math.floor(resolution));

  const preparedFeatures = prepareTerrainFeatures(terrain);

  const polygons = getExteriorPolygons(
    width,
    length,
    floorSections
  );

  const maxEdge = Math.max(
    width / segments,
    length / segments
  );

  const vertices = [];
  const indices = [];
  const uvs = [];
  const colors = [];

  // Reuse vertices so normals can be averaged
  // across neighbouring triangles.
  const vertexLookup = new Map();

  function addVertex(point) {
    const x = point.x;
    const z = point.y;

    const key = `${x.toFixed(7)},${z.toFixed(7)}`;

    if (vertexLookup.has(key)) {
      return vertexLookup.get(key);
    }

    const y = getTerrainHeight(
      x,
      z,
      terrain,
      preparedFeatures
    );

    if (!Number.isFinite(y)) {
      throw new Error(
        `Invalid terrain height at ${x}, ${z}`
      );
    }

    const index = vertices.length / 3;

    vertices.push(x, y, z);

    uvs.push(
      x / width + 0.5,
      z / length + 0.5
    );

    const surface = getTerrainSurface(
      x,
      z,
      terrain
    );

    const material = getTerrainMaterial(surface);
    const color = new THREE.Color(material.color);

    colors.push(color.r, color.g, color.b);

    vertexLookup.set(key, index);

    return index;
  }

  function addTriangle(a, b, c) {
    const area =
      (b.x - a.x) * (c.y - a.y) -
      (b.y - a.y) * (c.x - a.x);

    if (Math.abs(area) < 1e-12) return;

    const ia = addVertex(a);
    const ib = addVertex(b);
    const ic = addVertex(c);

    // XZ triangles need clockwise winding when
    // viewed from above to produce upward normals.
    if (area < 0) {
      indices.push(ia, ib, ic);
    } else {
      indices.push(ia, ic, ib);
    }
  }

  for (const polygon of polygons) {
    const triangles = triangulatePolygon(polygon);

    for (const [a, b, c] of triangles) {
      subdivideTriangle(
        a,
        b,
        c,
        maxEdge,
        addTriangle
      );
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2)
  );

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  geometry.setIndex(indices);

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return {
    geometry,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
