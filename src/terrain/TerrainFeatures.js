// src/terrain/TerrainFeatures.js

import {
  createTerrainSpline,
  sampleTerrainSpline,
  smoothstep,
} from "./TerrainSpline";

// ============================================================
// UTILITIES
// ============================================================

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const EPSILON = 0.001;

function positive(value, fallback) {
  return Math.max(EPSILON, value ?? fallback);
}

// ============================================================
// UNIFIED RADIAL DEFORMATION
// ============================================================

function radialDeformation(
  x,
  z,
  feature,
  {
    amplitude = 0,
    defaultRadius = 3,
    useEllipse = false,
    falloff = 1,
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

  const dx = (x - cx) / radiusX;
  const dz = (z - cz) / radiusZ;

  const distance = Math.hypot(dx, dz);

  if (distance >= 1) return 0;

  const influence =
    1 - smoothstep(distance);

  const exponent = Math.max(
    0.1,
    feature.falloff ?? falloff
  );

  return (
    amplitude *
    Math.pow(influence, exponent)
  );
}

// ============================================================
// RADIAL FEATURE TYPES
// ============================================================

function hill(x, z, feature) {
  return radialDeformation(
    x,
    z,
    feature,
    {
      amplitude: feature.height ?? 1,
    }
  );
}

function valley(x, z, feature) {
  return radialDeformation(
    x,
    z,
    feature,
    {
      amplitude: -(feature.depth ?? 1),
    }
  );
}

function bowl(x, z, feature) {
  return radialDeformation(
    x,
    z,
    feature,
    {
      amplitude: -(feature.depth ?? 1),
    }
  );
}

function mound(x, z, feature) {
  return hill(x, z, feature);
}

function deformation(x, z, feature) {
  return radialDeformation(
    x,
    z,
    feature,
    {
      amplitude: feature.height ?? 0,
      useEllipse: true,
    }
  );
}

// ============================================================
// LINEAR FEATURES
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

  const lengthSquared =
    dx * dx + dz * dz;

  if (lengthSquared < 1e-10) {
    return Math.hypot(
      x - ax,
      z - az
    );
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

function ridge(x, z, feature) {
  const [ax, az] = feature.start;
  const [bx, bz] = feature.end;

  const distance = distanceToSegment(
    x,
    z,
    ax,
    az,
    bx,
    bz
  );

  return (
    (feature.height ?? 1) *
    (
      1 -
      smoothstep(
        distance /
        positive(feature.width, 2)
      )
    )
  );
}

function ledge(x, z, feature) {
  const [ax, az] = feature.start;
  const [bx, bz] = feature.end;

  const distance = distanceToSegment(
    x,
    z,
    ax,
    az,
    bx,
    bz
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
        (distance - halfWidth) /
        edgeWidth
      )
    )
  );
}

function slope(x, z, feature) {
  const [dx, dz] =
    feature.direction ?? [1, 0];

  return (
    (x * dx + z * dz) *
    (feature.gradient ?? 0.1)
  );
}

// ============================================================
// PLATEAUS AND CLIFFS
// ============================================================

function plateau(x, z, feature) {
  const [cx, cz] = feature.position;

  const distance = Math.hypot(
    x - cx,
    z - cz
  );

  const radius = positive(
    feature.radius,
    5
  );

  const edgeWidth = positive(
    feature.edgeWidth,
    2
  );

  return (
    (feature.height ?? 2) *
    (
      1 -
      smoothstep(
        (distance - radius) /
        edgeWidth
      )
    )
  );
}

function cliff(x, z, feature) {
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
}

// ============================================================
// SPLINE FEATURES
// ============================================================

function splinePath(x, z, feature, spline) {
  const sample = sampleTerrainSpline(
    x,
    z,
    spline
  );

  return (
    sample.height *
    sample.influence
  );
}

function splineRidge(x, z, feature, spline) {
  const sample = sampleTerrainSpline(
    x,
    z,
    spline
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
}

function splineValley(x, z, feature, spline) {
  const sample = sampleTerrainSpline(
    x,
    z,
    spline
  );

  return (
    -(feature.depth ?? 2) *
    sample.influence
  );
}

function bankedPath(x, z, feature, spline) {
  const points = spline.samples;

  let best = Infinity;
  let signed = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const lengthSquared =
      dx * dx + dz * dz;

    if (lengthSquared < 1e-10) {
      continue;
    }

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

    const distanceSquared =
      rx * rx + rz * rz;

    if (distanceSquared < best) {
      best = distanceSquared;

      signed =
        (dx * rz - dz * rx) /
        Math.sqrt(lengthSquared);
    }
  }

  const halfWidth =
    positive(feature.width, 4) / 2;

  const distance = Math.sqrt(best);

  const edgeWidth = positive(
    feature.edgeWidth,
    1
  );

  if (distance > halfWidth + edgeWidth) {
    return 0;
  }

  const blend =
    1 -
    smoothstep(
      (distance - halfWidth) /
      edgeWidth
    );

  return (
    signed *
    (feature.gradient ?? 0.15) *
    blend
  );
}

// ============================================================
// FEATURE REGISTRY
// ============================================================

const FEATURE_GENERATORS = {
  hill,
  valley,
  bowl,
  mound,
  deformation,

  ridge,
  ledge,
  slope,
  plateau,
  cliff,

  splinePath,
  splineRidge,
  splineValley,
  bankedPath,
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
// blending helper

const BLEND_MODES = new Set([
  "add",
  "max",
  "min",
  "replace",
]);

function blendTerrainHeight(
  currentHeight,
  contribution,
  feature,
  baseHeight
) {
  const mode = feature.blend ?? "add";

  if (!BLEND_MODES.has(mode)) {
    return currentHeight + contribution;
  }

  const strength = clamp(
    feature.strength ?? 1,
    0,
    1
  );

  switch (mode) {
    case "max": {
      const target = baseHeight + contribution;

      return currentHeight +
        (Math.max(currentHeight, target) -
          currentHeight) *
        strength;
    }

    case "min": {
      const target = baseHeight + contribution;

      return currentHeight +
        (Math.min(currentHeight, target) -
          currentHeight) *
        strength;
    }

    case "replace": {
      // A replace feature supplies an absolute
      // target height and a spatial influence.
      const target =
        feature.targetHeight ?? baseHeight;

      const influence = clamp(
        Math.abs(contribution),
        0,
        1
      );

      return currentHeight + (target - currentHeight) * influence * strength;
    }

    default: return currentHeight + contribution * strength;
  }
}

// ============================================================
// HEIGHT SAMPLING
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

// ============================================================
// COURSE HEIGHT
// ============================================================

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

  const [x, y = 0, z] =
    object.position;

  const floorHeight = getCourseHeight(
    x,
    z,
    terrain
  );

  return {
    ...object,
    position: [
      x,
      floorHeight + y,
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
