// src/terrain/Terrain.js

import * as THREE from "three";
import { getTerrainSurface } from "./TerrainRegions";

// ============================================================
// UTILITIES
// ============================================================

const EPSILON = 0.001;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const positive = (value, fallback) =>
  Math.max(EPSILON, value ?? fallback);

export function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

// ============================================================
// SHARED PATH SAMPLING
// ============================================================

function createPathSamples(
  points,
  sampleCount
) {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.some(
      (point) =>
        !Array.isArray(point) ||
        point.length < 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1])
    )
  ) {
    throw new Error(
      "Terrain path requires at least two valid [x,z] points"
    );
  }

  const curve = new THREE.CatmullRomCurve3(
    points.map(
      ([x, z]) => new THREE.Vector3(x, 0, z)
    ),
    false,
    "centripetal"
  );

  return curve.getPoints(sampleCount);
}

function nearestPathSample(x, z, points) {
  let bestDistanceSquared = Infinity;
  let progress = 0;
  let signedDistance = 0;

  const count = points.length - 1;

  for (let i = 0; i < count; i++) {
    const a = points[i];
    const b = points[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const lengthSquared = dx * dx + dz * dz;

    if (lengthSquared < 1e-10) continue;

    const t = clamp(
      (
        (x - a.x) * dx +
        (z - a.z) * dz
      ) / lengthSquared,
      0,
      1
    );

    const px = a.x + t * dx;
    const pz = a.z + t * dz;

    const rx = x - px;
    const rz = z - pz;

    const distanceSquared = rx * rx + rz * rz;

    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      progress = (i + t) / count;

      signedDistance =
        (dx * rz - dz * rx) /
        Math.sqrt(lengthSquared);
    }
  }

  return {
    distance: Math.sqrt(bestDistanceSquared),
    signedDistance,
    progress,
  };
}

// ============================================================
// TERRAIN SPLINES
// ============================================================

export function createTerrainSpline(feature) {
  const points = feature.points;

  const samples = createPathSamples(
    points,
    Math.max(
      32,
      Math.floor(
        feature.samples ?? points.length * 32
      )
    )
  );

  return {
    samples,
    width: positive(feature.width, 3),
    edgeWidth: positive(feature.edgeWidth, 1),
    height: feature.height ?? 2,
    startHeight: feature.startHeight,
    endHeight: feature.endHeight,
  };
}

export function sampleTerrainSpline(x, z, spline) {
  const sample = nearestPathSample(
    x,
    z,
    spline.samples
  );

  const influence =
    1 -
    smoothstep(
      (sample.distance - spline.width / 2) /
      spline.edgeWidth
    );

  const startHeight =
    spline.startHeight ?? spline.height;

  const endHeight =
    spline.endHeight ?? spline.height;

  return {
    ...sample,
    influence,
    height:
      startHeight +
      (endHeight - startHeight) *
        sample.progress,
  };
}

// ============================================================
// FAIRWAYS
// ============================================================

export function createFairwaySampler(fairway) {
  if (
    !fairway?.points ||
    fairway.points.length < 2
  ) {
    return null;
  }

  return {
    points: createPathSamples(
      fairway.points,
      Math.max(
        32,
        fairway.points.length * 24
      )
    ),
    width: fairway.width ?? 3,
    flatten: fairway.flatten ?? 0.8,
    shoulder: fairway.shoulder ?? 2,
  };
}

export function getFairwayInfluence(
  x,
  z,
  sampler
) {
  if (!sampler) return 0;

  const { distance } = nearestPathSample(
    x,
    z,
    sampler.points
  );

  const halfWidth = sampler.width / 2;

  if (distance <= halfWidth) return 1;

  const t = clamp(
    (distance - halfWidth) /
      Math.max(EPSILON, sampler.shoulder),
    0,
    1
  );

  return 1 - smoothstep(t);
}

// ============================================================
// RADIAL DEFORMATION
// ============================================================

function radialInfluence(
  x,
  z,
  feature,
  {
    defaultRadius = 3,
    useEllipse = false,
  } = {}
) {
  const [cx, cz] = feature.position;

  const radius = positive(
    feature.radius,
    defaultRadius
  );

  const radiusX = useEllipse
    ? positive(feature.radiusX, radius)
    : radius;

  const radiusZ = useEllipse
    ? positive(feature.radiusZ, radius)
    : radius;

  const distance = Math.hypot(
    (x - cx) / radiusX,
    (z - cz) / radiusZ
  );

  if (distance >= 1) return 0;

  const falloff = Math.max(
    0.1,
    feature.falloff ?? 1
  );

  return Math.pow(
    1 - smoothstep(distance),
    falloff
  );
}

function radialDeformation(
  x,
  z,
  feature,
  amplitude,
  options
) {
  return (
    amplitude *
    radialInfluence(x, z, feature, options)
  );
}

// ============================================================
// LINEAR GEOMETRY HELPERS
// ============================================================

function distanceToSegment(
  x,
  z,
  ax,
  az,
  bx,
  bz
) {
  const dx = bx - ax;
  const dz = bz - az;

  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared < 1e-10) {
    return Math.hypot(x - ax, z - az);
  }

  const t = clamp(
    (
      (x - ax) * dx +
      (z - az) * dz
    ) / lengthSquared,
    0,
    1
  );

  return Math.hypot(
    x - ax - t * dx,
    z - az - t * dz
  );
}

// ============================================================
// TERRAIN FEATURE GENERATORS
// ============================================================

const FEATURE_GENERATORS = {
  hill(x, z, feature) {
    return radialDeformation(
      x,
      z,
      feature,
      feature.height ?? 1
    );
  },

  mound(x, z, feature) {
    return radialDeformation(
      x,
      z,
      feature,
      feature.height ?? 1
    );
  },

  valley(x, z, feature) {
    return radialDeformation(
      x,
      z,
      feature,
      -(feature.depth ?? 1)
    );
  },

  bowl(x, z, feature) {
    return radialDeformation(
      x,
      z,
      feature,
      -(feature.depth ?? 1)
    );
  },

  deformation(x, z, feature) {
    return radialDeformation(
      x,
      z,
      feature,
      feature.height ?? 0,
      { useEllipse: true }
    );
  },

  ridge(x, z, feature) {
    const [ax, az] = feature.start;
    const [bx, bz] = feature.end;

    const distance = distanceToSegment(
      x, z, ax, az, bx, bz
    );

    return (
      (feature.height ?? 1) *
      (
        1 -
        smoothstep(
          distance / positive(feature.width, 2)
        )
      )
    );
  },

  ledge(x, z, feature) {
    const [ax, az] = feature.start;
    const [bx, bz] = feature.end;

    const distance = distanceToSegment(
      x, z, ax, az, bx, bz
    );

    const halfWidth =
      positive(feature.width, 2) / 2;

    const edgeWidth =
      positive(feature.edgeWidth, 0.5);

    return (
      (feature.height ?? 1.5) *
      (
        1 -
        smoothstep(
          (distance - halfWidth) / edgeWidth
        )
      )
    );
  },

  slope(x, z, feature) {
    const [dx, dz] =
      feature.direction ?? [1, 0];

    return (
      (x * dx + z * dz) *
      (feature.gradient ?? 0.1)
    );
  },

  plateau(x, z, feature) {
    const [cx, cz] = feature.position;

    const distance = Math.hypot(
      x - cx,
      z - cz
    );

    return (
      (feature.height ?? 2) *
      (
        1 -
        smoothstep(
          (
            distance -
            positive(feature.radius, 5)
          ) /
          positive(feature.edgeWidth, 2)
        )
      )
    );
  },

  cliff(x, z, feature) {
    const [ax, az] = feature.start;
    const [bx, bz] = feature.end;

    const dx = bx - ax;
    const dz = bz - az;

    const length = Math.hypot(dx, dz);

    if (length < EPSILON) return 0;

    const distance =
      (x - ax) * (-dz / length) +
      (z - az) * (dx / length);

    const sharpness = positive(
      feature.sharpness,
      0.5
    );

    return (
      (feature.height ?? 3) *
      smoothstep(
        (distance + sharpness) /
        (2 * sharpness)
      )
    );
  },

  splinePath(x, z, feature, spline) {
    const sample = sampleTerrainSpline(
      x, z, spline
    );

    return sample.height * sample.influence;
  },

  splineRidge(x, z, feature, spline) {
    const sample = sampleTerrainSpline(
      x, z, spline
    );

    return (
      sample.height *
      (
        1 -
        smoothstep(
          sample.distance /
          positive(feature.width, 3)
        )
      )
    );
  },

  splineValley(x, z, feature, spline) {
    return (
      -(feature.depth ?? 2) *
      sampleTerrainSpline(
        x, z, spline
      ).influence
    );
  },

  bankedPath(x, z, feature, spline) {
    const sample = nearestPathSample(
      x,
      z,
      spline.samples
    );

    const halfWidth =
      positive(feature.width, 4) / 2;

    const edgeWidth =
      positive(feature.edgeWidth, 1);

    if (
      sample.distance >
      halfWidth + edgeWidth
    ) {
      return 0;
    }

    const influence =
      1 -
      smoothstep(
        (sample.distance - halfWidth) /
        edgeWidth
      );

    return (
      sample.signedDistance *
      (feature.gradient ?? 0.15) *
      influence
    );
  },
};

const SPLINE_TYPES = new Set([
  "splinePath",
  "splineRidge",
  "splineValley",
  "bankedPath",
]);

// ============================================================
// FEATURE PREPARATION
// ============================================================

export function prepareTerrainFeatures(terrain) {
  return (terrain?.features ?? []).map(
    (feature) => ({
      feature,

      generator:
        FEATURE_GENERATORS[feature.type],

      spline: SPLINE_TYPES.has(feature.type)
        ? createTerrainSpline(feature)
        : null,
    })
  );
}

// ============================================================
// TERRAIN BLENDING
// ============================================================

function blendTerrainHeight(
  currentHeight,
  contribution,
  feature,
  baseHeight
) {
  const mode = feature.blend ?? "add";

  const strength = clamp(
    feature.strength ?? 1,
    0,
    1
  );

  switch (mode) {
    case "max": {
      const target = baseHeight + contribution;

      return currentHeight +
        (
          Math.max(currentHeight, target) -
          currentHeight
        ) * strength;
    }

    case "min": {
      const target = baseHeight + contribution;

      return currentHeight +
        (
          Math.min(currentHeight, target) -
          currentHeight
        ) * strength;
    }

    case "replace": {
      const target =
        feature.targetHeight ?? baseHeight;

      const influence = clamp(
        Math.abs(contribution),
        0,
        1
      );

      return currentHeight +
        (target - currentHeight) *
        influence *
        strength;
    }

    default:
      return (
        currentHeight +
        contribution * strength
      );
  }
}

// ============================================================
// HEIGHT CALCULATION
// ============================================================

export function getTerrainHeight(
  x,
  z,
  terrain,
  preparedFeatures = null
) {
  const baseHeight =
    terrain?.baseHeight ?? 0;

  let height = baseHeight;

  const features =
    preparedFeatures ??
    prepareTerrainFeatures(terrain);

  for (const entry of features) {
    if (!entry.generator) continue;

    const contribution = entry.generator(
      x,
      z,
      entry.feature,
      entry.spline
    );

    height = blendTerrainHeight(
      height,
      contribution,
      entry.feature,
      baseHeight
    );
  }

  return height;
}

export function getCourseHeight(
  x,
  z,
  terrain,
  preparedFeatures = null
) {
  if (!terrain) return 0;

  return (
    getTerrainHeight(
      x,
      z,
      terrain,
      preparedFeatures
    ) -
    (terrain.baseHeight ?? 0)
  );
}

// ============================================================
// HEIGHT SAMPLER
// ============================================================

export function createTerrainHeightSampler(
  terrain,
  preparedFeatures = null,
  {
    precision = 6,
    maxEntries = 100000,
  } = {}
) {
  const features =
    preparedFeatures ??
    prepareTerrainFeatures(terrain);

  const cache = new Map();

  let hits = 0;
  let misses = 0;

  function heightAt(x, z) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(z)
    ) {
      throw new Error(
        `Invalid terrain coordinates: ${x}, ${z}`
      );
    }

    const key =
      `${x.toFixed(precision)},${z.toFixed(precision)}`;

    if (cache.has(key)) {
      hits++;
      return cache.get(key);
    }

    const height = getCourseHeight(
      x,
      z,
      terrain,
      features
    );

    if (!Number.isFinite(height)) {
      throw new Error(
        `Invalid terrain height at ${x}, ${z}`
      );
    }

    misses++;

    if (cache.size >= maxEntries) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, height);

    return height;
  }

  function clear() {
    cache.clear();
    hits = 0;
    misses = 0;
  }

  function stats() {
    const total = hits + misses;

    return {
      entries: cache.size,
      hits,
      misses,
      hitRate:
        total > 0 ? hits / total : 0,
    };
  }

  return {
    heightAt,
    clear,
    stats,
  };
}

// ============================================================
// OBJECT ALIGNMENT
// ============================================================

export function alignObjectToTerrain(
  object,
  terrain
) {
  if (
    !object?.terrainAlign ||
    !terrain ||
    !Array.isArray(object.position)
  ) {
    return object;
  }

  const [x, y = 0, z] = object.position;

  return {
    ...object,
    position: [
      x,
      getCourseHeight(x, z, terrain) + y,
      z,
    ],
  };
}

export function alignPositionToCourse(
  position,
  terrain,
  offsetY = 0
) {
  if (!Array.isArray(position)) {
    return [0, offsetY, 0];
  }

  const [x, , z] = position;

  return [
    x,
    getCourseHeight(x, z, terrain) +
      offsetY,
    z,
  ];
}

// ============================================================
// UNIFIED TERRAIN INSTANCE
// ============================================================

export function createTerrain(terrain = {}) {
  const preparedFeatures =
    prepareTerrainFeatures(terrain);

  const sampler = createTerrainHeightSampler(
    terrain,
    preparedFeatures
  );

  return {
    config: terrain,
    preparedFeatures,

    heightAt: sampler.heightAt,


    worldHeightAt(x, z) {
      return (
        sampler.heightAt(x, z) +
        (terrain.baseHeight ?? 0)
      );
    },

    surfaceAt(x, z) {
      return getTerrainSurface(x, z, terrain);
    },

    align(position, offsetY = 0) {
      if (!Array.isArray(position)) {
        return [0, offsetY, 0];
      }

      const [x, , z] = position;

      return [
        x,
        sampler.heightAt(x, z) + offsetY,
        z,
      ];
    },

    clearCache: sampler.clear,
    stats: sampler.stats,
  };
}
