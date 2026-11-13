// src/terrain/BoundaryGeometry.js

import * as THREE from "three";

// Geometry builders extracted without changing their algorithms.

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


export {
  createConformingWallGeometry,
  createBoundaryGeometry,
  simplifyCollisionRings,
};
