// src/terrain/TerrainMesh.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";
import { getTerrainHeight, prepareTerrainFeatures } from "./Terrain";
import { getTerrainSurface } from "./TerrainRegions";
import { getTerrainMaterial } from "./TerrainMaterials";

const EPSILON = 1e-10;

const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
const pointKey = (x, z) => `${x.toFixed(8)},${z.toFixed(8)}`;

// ============================================================
// POLYGON HELPERS
// ============================================================

export function closeRing(points) {
  if (!Array.isArray(points)) return [];

  const ring = [];

  for (const point of points) {
    if (
      !Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1])
    ) {
      continue;
    }

    const [x, z] = point;
    const last = ring.at(-1);

    if (!last || last[0] !== x || last[1] !== z) {
      ring.push([x, z]);
    }
  }

  if (ring.length < 3) return [];

  if (
    ring[0][0] !== ring.at(-1)[0] ||
    ring[0][1] !== ring.at(-1)[1]
  ) {
    ring.push([...ring[0]]);
  }

  return ring;
}

export function triangulateXZ(polygon) {
  if (!polygon?.length) return [];

  const vectors = (ring) => {
    const closed =
      ring.length > 1 &&
      ring[0][0] === ring.at(-1)[0] &&
      ring[0][1] === ring.at(-1)[1];

    return (closed ? ring.slice(0, -1) : ring)
      .map(([x, z]) => new THREE.Vector2(x, z));
  };

  const outer = vectors(polygon[0]);

  if (outer.length < 3) return [];

  const holes = polygon.slice(1).map(vectors);
  const points = [...outer, ...holes.flat()];

  return THREE.ShapeUtils.triangulateShape(
    outer,
    holes
  ).map(([a, b, c]) => [
    points[a],
    points[b],
    points[c],
  ]);
}

export function upwardTriangleIndices(
  a,
  b,
  c,
  ia,
  ib,
  ic,
  out
) {
  const area =
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x);

  if (Math.abs(area) < 1e-12) return;

  if (area < 0) {
    out.push(ia, ib, ic);
  } else {
    out.push(ia, ic, ib);
  }
}

// Retained for legacy callers.
export function subdivideXZ(
  a,
  b,
  c,
  maxEdge,
  emit
) {
  if (!(maxEdge > 0)) {
    throw new Error("maxEdge must be positive");
  }

  const stack = [[a, b, c]];
  const limit = maxEdge * maxEdge;

  while (stack.length) {
    const triangle = stack.pop();

    const edges = [
      [triangle[0], triangle[1], triangle[2]],
      [triangle[1], triangle[2], triangle[0]],
      [triangle[2], triangle[0], triangle[1]],
    ];

    let longest = edges[0];
    let max = -1;

    for (const edge of edges) {
      const dx = edge[0].x - edge[1].x;
      const dz = edge[0].y - edge[1].y;
      const squared = dx * dx + dz * dz;

      if (squared > max) {
        max = squared;
        longest = edge;
      }
    }

    if (max <= limit) {
      emit(...triangle);
      continue;
    }

    const [p, q, other] = longest;

    const midpoint = new THREE.Vector2(
      (p.x + q.x) / 2,
      (p.y + q.y) / 2
    );

    stack.push(
      [p, midpoint, other],
      [midpoint, q, other]
    );
  }
}

// ============================================================
// ADAPTIVE TRIANGULATION
// ============================================================

export function adaptiveSubdivideXZ(
  sourceTriangles,
  heightAt,
  {
    maxEdge = 1.2,
    minEdge = 0.15,
    heightTolerance = 0.02,
    maxIterations = 10,
    maxTriangles = 50000,
  } = {}
) {
  if (
    !Number.isFinite(maxEdge) ||
    maxEdge <= 0 ||
    !Number.isFinite(minEdge) ||
    minEdge <= 0 ||
    (
      typeof heightTolerance !== "number" ||
      Number.isNaN(heightTolerance) ||
      heightTolerance < 0
    ) ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 0 ||
    !Number.isInteger(maxTriangles) ||
    maxTriangles < 1
  ) {
    throw new Error(
      "Invalid adaptive terrain mesh settings"
    );
  }

  const vertices = [];
  const lookup = new Map();

  function vertex(x, z) {
    const key = pointKey(x, z);
    const cached = lookup.get(key);

    if (cached !== undefined) return cached;

    const y = heightAt(x, z);

    if (![x, y, z].every(Number.isFinite)) {
      throw new Error(
        `Invalid terrain vertex at ${x}, ${z}`
      );
    }

    const index = vertices.length;

    vertices.push({ x, y, z });
    lookup.set(key, index);

    return index;
  }

  let triangles = sourceTriangles.map(
    ([a, b, c]) => [
      vertex(a.x, a.y),
      vertex(b.x, b.y),
      vertex(c.x, c.y),
    ]
  );

  if (triangles.length > maxTriangles) {
    throw new Error(
      "Initial terrain exceeds maxTriangles"
    );
  }

  const minLength = Math.min(minEdge, maxEdge);

  for (
    let iteration = 0;
    iteration < maxIterations;
    iteration++
  ) {
    const marked = new Set();

    function examine(a, b) {
      const key = edgeKey(a, b);

      if (marked.has(key)) return;

      const va = vertices[a];
      const vb = vertices[b];

      const length = Math.hypot(
        va.x - vb.x,
        va.z - vb.z
      );

      if (length <= minLength) return;

      if (length > maxEdge) {
        marked.add(key);
        return;
      }

      const mx = (va.x + vb.x) / 2;
      const mz = (va.z + vb.z) / 2;

      const actual = heightAt(mx, mz);

      if (!Number.isFinite(actual)) {
        throw new Error(
          `Invalid terrain height at ${mx}, ${mz}`
        );
      }

      const expected = (va.y + vb.y) / 2;

      if (Math.abs(actual - expected) > heightTolerance) {
        marked.add(key);
      }
    }

    for (const [a, b, c] of triangles) {
      examine(a, b);
      examine(b, c);
      examine(c, a);
    }

    if (!marked.size) break;

    // Each marked edge must be split in every
    // triangle sharing it.
    let expectedCount = 0;

    for (const [a, b, c] of triangles) {
      const count =
        Number(marked.has(edgeKey(a, b))) +
        Number(marked.has(edgeKey(b, c))) +
        Number(marked.has(edgeKey(c, a)));

      expectedCount += [1, 2, 3, 4][count];
    }

    if (expectedCount > maxTriangles) {
      break;
    }

    const midpoints = new Map();

    function midpoint(a, b) {
      const key = edgeKey(a, b);

      if (!marked.has(key)) return null;

      const cached = midpoints.get(key);

      if (cached !== undefined) return cached;

      const va = vertices[a];
      const vb = vertices[b];

      const mx = (va.x + vb.x) / 2;
      const mz = (va.z + vb.z) / 2;

      const index = vertex(mx, mz);

      midpoints.set(key, index);

      return index;
    }

    const next = [];

    for (const [a, b, c] of triangles) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);

      const hasAB = ab !== null;
      const hasBC = bc !== null;
      const hasCA = ca !== null;

      const count =
        Number(hasAB) +
        Number(hasBC) +
        Number(hasCA);

      if (count === 0) {
        next.push([a, b, c]);
      } else if (count === 1) {
        if (hasAB) {
          next.push([a, ab, c], [ab, b, c]);
        } else if (hasBC) {
          next.push([b, bc, a], [bc, c, a]);
        } else {
          next.push([c, ca, b], [ca, a, b]);
        }
      } else if (count === 2) {
        if (hasAB && hasBC) {
          next.push(
            [a, ab, c],
            [ab, bc, c],
            [ab, b, bc]
          );
        } else if (hasBC && hasCA) {
          next.push(
            [b, bc, a],
            [bc, ca, a],
            [bc, c, ca]
          );
        } else {
          next.push(
            [c, ca, b],
            [ca, ab, b],
            [ca, a, ab]
          );
        }
      } else {
        next.push(
          [a, ab, ca],
          [ab, b, bc],
          [ca, bc, c],
          [ab, bc, ca]
        );
      }
    }

    triangles = next;
  }

  return { vertices, triangles };
}

// ============================================================
// BUFFER GEOMETRY
// ============================================================

export function createTerrainGeometry(
  triangles,
  heightAt,
  {
    width = 30,
    length = 40,
    maxEdge = 1.2,
    minEdge = 0.15,
    heightTolerance = 0.02,
    maxIterations = 10,
    maxTriangles = 50000,
    surfaceAt = null,
  } = {}
) {
  const mesh = adaptiveSubdivideXZ(
    triangles,
    heightAt,
    {
      maxEdge,
      minEdge,
      heightTolerance,
      maxIterations,
      maxTriangles,
    }
  );

  const positions = new Float32Array(
    mesh.vertices.length * 3
  );

  const uvs = new Float32Array(
    mesh.vertices.length * 2
  );

  const colors = surfaceAt
    ? new Float32Array(mesh.vertices.length * 3)
    : null;

  const materialColors = new Map();

  for (let i = 0; i < mesh.vertices.length; i++) {
    const { x, y, z } = mesh.vertices[i];

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    uvs[i * 2] = x / width + 0.5;
    uvs[i * 2 + 1] = z / length + 0.5;

    if (colors) {
      const surface = surfaceAt(x, z);

      let color = materialColors.get(surface);

      if (!color) {
        color = new THREE.Color(
          getTerrainMaterial(surface).color
        );

        materialColors.set(surface, color);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  const indices = [];

  for (const [ia, ib, ic] of mesh.triangles) {
    const a = mesh.vertices[ia];
    const b = mesh.vertices[ib];
    const c = mesh.vertices[ic];

    upwardTriangleIndices(
      { x: a.x, y: a.z },
      { x: b.x, y: b.z },
      { x: c.x, y: c.z },
      ia,
      ib,
      ic,
      indices
    );
  }

  const indexArray = new Uint32Array(indices);

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(uvs, 2)
  );

  if (colors) {
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
  }

  geometry.setIndex(
    new THREE.BufferAttribute(indexArray, 1)
  );

  if (indices.length) {
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  }

  return {
    geometry,
    vertices: positions,
    indices: indexArray,
  };
}

// ============================================================
// LEGACY GEOMETRY SUBDIVISION
// ============================================================

export function subdivideGeometryXZ(
  geometry,
  maxEdge,
  getHeight,
  {
    maxIterations = 20,
    maxTriangles = 250000,
  } = {}
) {
  if (!Number.isFinite(maxEdge) || maxEdge <= 0) {
    throw new Error(
      "maxEdge must be a finite positive number"
    );
  }

  const position = geometry.getAttribute("position");
  const index = geometry.index;

  if (!position || !index) {
    throw new Error(
      "Expected indexed BufferGeometry"
    );
  }

  const triangles = [];
  const indices = index.array;

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];

    triangles.push([
      new THREE.Vector2(
        position.getX(a),
        position.getZ(a)
      ),
      new THREE.Vector2(
        position.getX(b),
        position.getZ(b)
      ),
      new THREE.Vector2(
        position.getX(c),
        position.getZ(c)
      ),
    ]);
  }

  return createTerrainGeometry(
    triangles,
    getHeight,
    {
      maxEdge,
      minEdge: maxEdge,

      // Disable height-based refinement.
      heightTolerance: Infinity,

      maxIterations,
      maxTriangles,
    }
  ).geometry;
}

// ============================================================
// EXTERIOR TERRAIN
// ============================================================

function getExteriorPolygons(
  width,
  length,
  sections
) {
  const hw = width / 2;
  const hl = length / 2;

  const boundary = [[
    closeRing([
      [-hw, -hl],
      [hw, -hl],
      [hw, hl],
      [-hw, hl],
    ]),
  ]];

  const exclusions = sections
    .filter((section) => section.type === "floor")
    .flatMap((section) => {
      if (section.polygons?.length) {
        return section.polygons;
      }

      if (section.points?.length >= 3) {
        return [[closeRing(section.points)]];
      }

      return [];
    });

  if (!exclusions.length) return boundary;

  return polygonClipping.difference(
    boundary,
    exclusions
  );
}

export function buildTerrain(
  terrain,
  floorSections = []
) {
  if (!terrain) {
    throw new Error(
      "Terrain configuration is required"
    );
  }

  const {
    width = 30,
    length = 40,
    resolution = 64,
  } = terrain;

  if (
    ![width, length, resolution].every(Number.isFinite) ||
    width <= 0 ||
    length <= 0 ||
    resolution < 2
  ) {
    throw new Error("Invalid terrain dimensions");
  }

  const prepared = prepareTerrainFeatures(terrain);

  const polygons = getExteriorPolygons(
    width,
    length,
    floorSections
  );

  const triangles = polygons.flatMap(
    (polygon) => triangulateXZ(polygon)
  );

  const defaultEdge = Math.max(
    width / Math.floor(resolution),
    length / Math.floor(resolution)
  );

  return createTerrainGeometry(
    triangles,
    (x, z) =>
      getTerrainHeight(
        x,
        z,
        terrain,
        prepared
      ),
    {
      width,
      length,
      maxEdge: terrain.meshMaxEdge ?? defaultEdge,
      minEdge: terrain.meshMinEdge ?? 0.15,
      heightTolerance:
        terrain.meshHeightTolerance ?? 0.02,
      maxIterations:
        terrain.meshMaxIterations ?? 10,
      maxTriangles:
        terrain.meshMaxTriangles ?? 50000,
      surfaceAt: (x, z) =>
        getTerrainSurface(x, z, terrain),
    }
  );
}

