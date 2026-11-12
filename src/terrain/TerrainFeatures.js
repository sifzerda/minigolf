// src/terrain/TerrainFeatures.js

import {
  createTerrainSpline,
  sampleTerrainSpline,
  smoothstep,
} from "./TerrainSpline";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hill(x, z, feature) {
  const [cx, cz] = feature.position;

  return (
    (feature.height ?? 1) * (1 - smoothstep(Math.hypot(x - cx, z - cz) / Math.max(0.001, feature.radius ?? 3)))
  );
}

function deformation(x, z, feature) {
  const [cx, cz] = feature.position;

  const radiusX = Math.max(
    0.001,
    feature.radiusX ?? feature.radius ?? 3
  );

  const radiusZ = Math.max(
    0.001,
    feature.radiusZ ?? feature.radius ?? 3
  );

  const dx = (x - cx) / radiusX;
  const dz = (z - cz) / radiusZ;

  const distance = Math.hypot(dx, dz);

  if (distance >= 1) return 0;

  const falloff = Math.max(
    0.1,
    feature.falloff ?? 1
  );

  const influence = Math.pow(
    1 - smoothstep(distance),
    falloff
  );

  return (
    (feature.height ?? 0) *
    influence
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

  if (!lengthSquared) return 0;

  const t = clamp(
    (
      (x - ax) * dx +
      (z - az) * dz
    ) / lengthSquared,
    0,
    1
  );

  const distance = Math.hypot(
    x - ax - t * dx,
    z - az - t * dz
  );

  return (
    (feature.height ?? 1) *
    (
      1 -
      smoothstep(
        distance /
        Math.max(0.001, feature.width ?? 2)
      )
    )
  );
}

function slope(x, z, feature) {
  const [dx, dz] = feature.direction ?? [1, 0];

  return (
    (x * dx + z * dz) * (feature.gradient ?? 0.1)
  );
}

function plateau(x, z, feature) {
  const [cx, cz] = feature.position;

  return (
    (feature.height ?? 2) *
    (
      1 -
      smoothstep(
        (
          Math.hypot(x - cx, z - cz) -
          Math.max(0.001, feature.radius ?? 5)
        ) /
        Math.max(
          0.001,
          feature.edgeWidth ?? 2
        )
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

  if (length < 0.001) return 0;

  const distance = (x - ax) * (-dz / length) + (z - az) * (dx / length);

  const sharpness = Math.max(
    0.001,
    feature.sharpness ?? 0.5
  );

  return (
    (feature.height ?? 3) *
    smoothstep(
      (distance + sharpness) /
      (2 * sharpness)
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
    (
      (x - ax) * dx +
      (z - az) * dz
    ) / lengthSquared,
    0,
    1
  );

  const distance = Math.hypot(
    x - ax - t * dx,
    z - az - t * dz
  );

  return (
    (feature.height ?? 1.5) *
    (
      1 -
      smoothstep(
        (
          distance -
          Math.max(
            0.001,
            feature.width ?? 2
          ) / 2
        ) /
        Math.max(
          0.001,
          feature.edgeWidth ?? 0.5
        )
      )
    )
  );
}

function splinePath(x, z, feature, spline) {
  const sample = sampleTerrainSpline(
    x,
    z,
    spline
  );

  return sample.height * sample.influence;
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
        Math.max(
          0.001,
          feature.width ?? 3
        )
      )
    )
  );
}

function splineValley(x, z, feature, spline) {
  return (
    -(feature.depth ?? 2) *
    sampleTerrainSpline(x, z, spline).influence
  );
}

function bowl(x, z, feature) {
  const [cx, cz] = feature.position;

  const t = clamp(
    Math.hypot(x - cx, z - cz) /
    Math.max(0.001, feature.radius ?? 3),
    0,
    1
  );

  return (
    -(feature.depth ?? 1) *
    (1 - smoothstep(t))
  );
}

function mound(x, z, feature) {
  return hill(x, z, feature);
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
    Math.max(0.01, feature.width ?? 4) / 2;

  const distance = Math.sqrt(best);
  const edgeWidth = feature.edgeWidth ?? 1;

  if (distance > halfWidth + edgeWidth) {
    return 0;
  }

  const blend =
    1 -
    smoothstep(
      (distance - halfWidth) /
      Math.max(0.001, edgeWidth)
    );

  return (
    signed *
    (feature.gradient ?? 0.15) *
    blend
  );
}

const FEATURE_GENERATORS = {
  hill,
  deformation,
  valley,
  ridge,
  slope,
  plateau,
  cliff,
  ledge,
  splinePath,
  splineRidge,
  splineValley,
  bowl,
  mound,
  bankedPath,
};

const SPLINE_TYPES = new Set([
  "splinePath",
  "splineRidge",
  "splineValley",
  "bankedPath",
]);

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

export function getTerrainHeight(
  x,
  z,
  terrain,
  preparedFeatures = null
) {
  let height = terrain?.baseHeight ?? 0;

  const features =
    preparedFeatures ??
    prepareTerrainFeatures(terrain);

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
  const floorHeight = getTerrainHeight(x, z, terrain) - (terrain.baseHeight ?? 0);

  return {
    ...object,
    position: [
      x,
      floorHeight + y,
      z,
    ],
  };
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
    getCourseHeight(x, z, terrain) + offsetY,
    z,
  ];
}
