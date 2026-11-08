// src/terrain/TerrainSpline.js

import * as THREE from "three";

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createTerrainSpline(feature) {
  const points = feature.points;

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
      "Terrain spline requires at least two valid [x, z] points"
    );
  }

  const controlPoints = points.map(
    ([x, z]) => new THREE.Vector3(x, 0, z)
  );

  const curve = new THREE.CatmullRomCurve3(
    controlPoints,
    false,
    "centripetal"
  );

  const sampleCount = Math.max(
    32,
    Math.floor(feature.samples ?? points.length * 32)
  );

  const samples = curve.getPoints(sampleCount);

  return {
    samples,
    width: Math.max(0.01, feature.width ?? 3),
    edgeWidth: Math.max(0.001, feature.edgeWidth ?? 1),
    height: feature.height ?? 2,
    startHeight: feature.startHeight,
    endHeight: feature.endHeight,
  };
}

export function sampleTerrainSpline(x, z, spline) {
  let closestDistanceSquared = Infinity;
  let closestProgress = 0;

  const points = spline.samples;
  const segmentCount = points.length - 1;

  for (let i = 0; i < segmentCount; i++) {
    const a = points[i];
    const b = points[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const lengthSquared = dx * dx + dz * dz;

    const t =
      lengthSquared > 0
        ? clamp(
            ((x - a.x) * dx + (z - a.z) * dz) /
              lengthSquared,
            0,
            1
          )
        : 0;

    const px = a.x + dx * t;
    const pz = a.z + dz * t;

    const distanceSquared =
      (x - px) ** 2 + (z - pz) ** 2;

    if (distanceSquared < closestDistanceSquared) {
      closestDistanceSquared = distanceSquared;
      closestProgress = (i + t) / segmentCount;
    }
  }

  const distance = Math.sqrt(closestDistanceSquared);

  const halfWidth = spline.width / 2;

  const influence =
    1 -
    smoothstep(
      (distance - halfWidth) / spline.edgeWidth
    );

  const startHeight =
    spline.startHeight ?? spline.height;

  const endHeight =
    spline.endHeight ?? spline.height;

  const height =
    startHeight +
    (endHeight - startHeight) * closestProgress;

  return {
    distance,
    progress: closestProgress,
    influence,
    height,
  };
}
