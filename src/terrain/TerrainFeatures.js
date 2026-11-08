// src/terrain/TerrainFeatures.js

import {
  createTerrainSpline,
  sampleTerrainSpline,
  smoothstep,
} from "./TerrainSpline";

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function hill(x, z, feature) {
  const [cx, cz] = feature.position;
  const radius = Math.max(0.001, feature.radius);

  const distance = Math.hypot(x - cx, z - cz);

  return (
    (feature.height ?? 1) *
    (1 - smoothstep(distance / radius))
  );
}

function valley(x, z, feature) {
  return -hill(x, z, {
    ...feature,
    height: feature.depth ?? 1,
  });
}

function ridge(x, z, feature) {
  const [ax, az] = feature.start;
  const [bx, bz] = feature.end;

  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared === 0) return 0;

  const t = clamp(
    ((x - ax) * dx + (z - az) * dz) / lengthSquared,
    0,
    1
  );

  const px = ax + dx * t;
  const pz = az + dz * t;

  const distance = Math.hypot(x - px, z - pz);
  const width = Math.max(0.001, feature.width);

  return (
    (feature.height ?? 1) *
    (1 - smoothstep(distance / width))
  );
}

function slope(x, z, feature) {
  const [dx, dz] = feature.direction ?? [1, 0];

  return (
    (x * dx + z * dz) *
    (feature.gradient ?? 0.1)
  );
}

function plateau(x, z, feature) {
  const [cx, cz] = feature.position;

  const radius = Math.max(
    0.001,
    feature.radius ?? 5
  );

  const edgeWidth = Math.max(
    0.001,
    feature.edgeWidth ?? 2
  );

  const distance = Math.hypot(x - cx, z - cz);

  return (
    (feature.height ?? 2) *
    (1 - smoothstep((distance - radius) / edgeWidth))
  );
}

function cliff(x, z, feature) {
  const [ax, az] = feature.start;
  const [bx, bz] = feature.end;

  const dx = bx - ax;
  const dz = bz - az;

  const length = Math.hypot(dx, dz);

  if (length < 0.001) return 0;

  const nx = -dz / length;
  const nz = dx / length;

  const signedDistance =
    (x - ax) * nx + (z - az) * nz;

  const sharpness = Math.max(
    0.001,
    feature.sharpness ?? 0.5
  );

  return (
    (feature.height ?? 3) *
    smoothstep(
      (signedDistance + sharpness) /
        (sharpness * 2)
    )
  );
}

function ledge(x, z, feature) {
  const [ax, az] = feature.start;
  const [bx, bz] = feature.end;

  const dx = bx - ax;
  const dz = bz - az;
  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared < 0.001) return 0;

  const t = clamp(
    ((x - ax) * dx + (z - az) * dz) /
      lengthSquared,
    0,
    1
  );

  const px = ax + dx * t;
  const pz = az + dz * t;

  const distance = Math.hypot(x - px, z - pz);

  const width = Math.max(
    0.001,
    feature.width ?? 2
  );

  const edgeWidth = Math.max(
    0.001,
    feature.edgeWidth ?? 0.5
  );

  return (
    (feature.height ?? 1.5) *
    (1 -
      smoothstep(
        (distance - width / 2) / edgeWidth
      ))
  );
}

// Flat-topped winding path with blended edges.
function splinePath(x, z, feature, spline) {
  const sample = sampleTerrainSpline(x, z, spline);

  return sample.height * sample.influence;
}

// Rounded winding ridgeline.
function splineRidge(x, z, feature, spline) {
  const sample = sampleTerrainSpline(x, z, spline);

  const radius = Math.max(
    0.001,
    feature.width ?? 3
  );

  const rounded = 1 - smoothstep(
    sample.distance / radius
  );

  return sample.height * rounded;
}

// Winding depression, suitable for valleys or riverbeds.
function splineValley(x, z, feature, spline) {
  const sample = sampleTerrainSpline(x, z, spline);

  const depth = feature.depth ?? 2;

  return -depth * sample.influence;
}

const FEATURE_GENERATORS = {
  hill,
  valley,
  ridge,
  slope,
  plateau,
  cliff,
  ledge,
  splinePath,
  splineRidge,
  splineValley,
};

const SPLINE_TYPES = new Set([
  "splinePath",
  "splineRidge",
  "splineValley",
]);

export function prepareTerrainFeatures(terrain) {
  return (terrain?.features ?? []).map((feature) => ({
    feature,
    generator: FEATURE_GENERATORS[feature.type],
    spline: SPLINE_TYPES.has(feature.type)
      ? createTerrainSpline(feature)
      : null,
  }));
}

export function getTerrainHeight(
  x,
  z,
  terrain,
  preparedFeatures = null
) {
  let height = terrain?.baseHeight ?? 0;

  const features =
    preparedFeatures ?? prepareTerrainFeatures(terrain);

  for (const entry of features) {
    if (!entry.generator) continue;

    height += entry.generator(
      x,
      z,
      entry.feature,
      entry.spline
    );
  }

  return height;
}
