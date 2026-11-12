// src/terrain/PolygonMesh.js

import * as THREE from "three";

// Shared XZ polygon triangulation, including interior holes.
export function triangulateXZ(polygon) {
  if (!polygon?.length) return [];
  const vectors = ring => {
    const end = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? -1 : undefined;
    return ring.slice(0, end).map(([x, z]) => new THREE.Vector2(x, z));
  };
  const outer = vectors(polygon[0]);
  if (outer.length < 3) return [];
  const holes = polygon.slice(1).map(vectors);
  const points = [...outer, ...holes.flat()];
  return THREE.ShapeUtils.triangulateShape(outer, holes)
    .map(([a, b, c]) => [points[a], points[b], points[c]]);
}

// Iterative subdivision avoids recursion limits on large terrain meshes.
export function subdivideXZ(a, b, c, maxEdge, emit) {
  if (!(maxEdge > 0)) throw new Error("maxEdge must be positive");
  const stack = [[a, b, c]];
  const limit = maxEdge * maxEdge;
  while (stack.length) {
    const triangle = stack.pop();
    const edges = [[triangle[0], triangle[1], triangle[2]], [triangle[1], triangle[2], triangle[0]], [triangle[2], triangle[0], triangle[1]]];
    let longest = edges[0], max = -1;
    for (const edge of edges) {
      const dx = edge[0].x - edge[1].x;
      const dz = edge[0].y - edge[1].y;
      const squared = dx * dx + dz * dz;
      if (squared > max) { max = squared; longest = edge; }
    }
    if (max <= limit) { emit(...triangle); continue; }
    const [p, q, other] = longest;
    const mid = new THREE.Vector2((p.x + q.x) / 2, (p.y + q.y) / 2);
    stack.push([p, mid, other], [mid, q, other]);
  }
}

export function upwardTriangleIndices(a, b, c, ia, ib, ic, out) {
  const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (Math.abs(area) < 1e-12) return;
  if (area < 0) out.push(ia, ib, ic);
  else out.push(ia, ic, ib);
}


export function subdivideGeometryXZ(
  geometry,
  maxEdge,
  getHeight,
  {
    maxIterations = 20,
    maxTriangles = 250000,
  } = {}
) {
  if (!(maxEdge > 0) || !Number.isFinite(maxEdge)) {
    throw new Error("maxEdge must be a finite positive number");
  }

  const source = geometry.getAttribute("position");

  if (!source || !geometry.index) {
    throw new Error("Expected indexed BufferGeometry");
  }

  const vertices = [];

  for (let i = 0; i < source.count; i++) {
    const x = source.getX(i);
    const z = source.getZ(i);
    const y = getHeight(x, z);

    if (![x, y, z].every(Number.isFinite)) {
      throw new Error(`Invalid terrain vertex at ${x}, ${z}`);
    }

    vertices.push(x, y, z);
  }

  let triangles = [];

  const original = geometry.index.array;

  for (let i = 0; i < original.length; i += 3) {
    triangles.push([
      original[i],
      original[i + 1],
      original[i + 2],
    ]);
  }

  const edgeKey = (a, b) =>
    a < b ? `${a}:${b}` : `${b}:${a}`;

  const edgeLengthSq = (a, b) => {
    const ax = vertices[a * 3];
    const az = vertices[a * 3 + 2];
    const bx = vertices[b * 3];
    const bz = vertices[b * 3 + 2];

    return (ax - bx) ** 2 + (az - bz) ** 2;
  };

  const midpointCache = new Map();

  function midpoint(a, b) {
    const key = edgeKey(a, b);
    const cached = midpointCache.get(key);

    if (cached !== undefined) return cached;

    const x =
      (vertices[a * 3] + vertices[b * 3]) / 2;

    const z =
      (vertices[a * 3 + 2] + vertices[b * 3 + 2]) / 2;

    const y = getHeight(x, z);

    if (!Number.isFinite(y)) {
      throw new Error(`Invalid terrain height at ${x}, ${z}`);
    }

    const index = vertices.length / 3;

    vertices.push(x, y, z);
    midpointCache.set(key, index);

    return index;
  }

  const limitSq = maxEdge * maxEdge;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const marked = new Set();

    for (const [a, b, c] of triangles) {
      if (edgeLengthSq(a, b) > limitSq) {
        marked.add(edgeKey(a, b));
      }

      if (edgeLengthSq(b, c) > limitSq) {
        marked.add(edgeKey(b, c));
      }

      if (edgeLengthSq(c, a) > limitSq) {
        marked.add(edgeKey(c, a));
      }
    }

    if (marked.size === 0) break;

    const next = [];

    for (const [a, b, c] of triangles) {
      const ab = marked.has(edgeKey(a, b));
      const bc = marked.has(edgeKey(b, c));
      const ca = marked.has(edgeKey(c, a));

      const count = Number(ab) + Number(bc) + Number(ca);

      if (count === 0) {
        next.push([a, b, c]);
        continue;
      }

      if (count === 1) {
        if (ab) {
          const m = midpoint(a, b);
          next.push([a, m, c], [m, b, c]);
        } else if (bc) {
          const m = midpoint(b, c);
          next.push([b, m, a], [m, c, a]);
        } else {
          const m = midpoint(c, a);
          next.push([c, m, b], [m, a, b]);
        }

        continue;
      }

      if (count === 2) {
        if (ab && bc) {
          const m1 = midpoint(a, b);
          const m2 = midpoint(b, c);

          next.push(
            [a, m1, c],
            [m1, m2, c],
            [m1, b, m2]
          );
        } else if (bc && ca) {
          const m1 = midpoint(b, c);
          const m2 = midpoint(c, a);

          next.push(
            [b, m1, a],
            [m1, m2, a],
            [m1, c, m2]
          );
        } else {
          const m1 = midpoint(c, a);
          const m2 = midpoint(a, b);

          next.push(
            [c, m1, b],
            [m1, m2, b],
            [m1, a, m2]
          );
        }

        continue;
      }

      const mab = midpoint(a, b);
      const mbc = midpoint(b, c);
      const mca = midpoint(c, a);

      next.push(
        [a, mab, mca],
        [mab, b, mbc],
        [mca, mbc, c],
        [mab, mbc, mca]
      );
    }

    if (next.length > maxTriangles) {
      throw new Error(
        `Terrain subdivision exceeded ${maxTriangles} triangles`
      );
    }

    triangles = next;
  }

  // Keep only vertices referenced by the final triangles.
  const remap = new Map();
  const positions = [];
  const indices = [];

  for (const triangle of triangles) {
    for (const oldIndex of triangle) {
      let newIndex = remap.get(oldIndex);

      if (newIndex === undefined) {
        newIndex = positions.length / 3;
        remap.set(oldIndex, newIndex);

        positions.push(
          vertices[oldIndex * 3],
          vertices[oldIndex * 3 + 1],
          vertices[oldIndex * 3 + 2]
        );
      }

      indices.push(newIndex);
    }
  }

  const result = new THREE.BufferGeometry();

  result.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  result.setIndex(indices);
  result.computeVertexNormals();
  result.computeBoundingSphere();

  return result;
}

