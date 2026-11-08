// src/terrain/TerrainFeatures.js

const smoothstep = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

function hill(x, z, feature) {
  const [cx, cz] = feature.position;
  const radius = Math.max(0.001, feature.radius);

  const dx = x - cx;
  const dz = z - cz;

  const distance = Math.hypot(dx, dz);
  const influence = 1 - smoothstep(distance / radius);

  return (feature.height ?? 1) * influence;
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

  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - ax) * dx + (z - az) * dz) /
        lengthSquared
    )
  );

  const nearestX = ax + dx * t;
  const nearestZ = az + dz * t;

  const distance = Math.hypot(
    x - nearestX,
    z - nearestZ
  );

  const width = Math.max(0.001, feature.width);
  const influence = 1 - smoothstep(distance / width);

  return (feature.height ?? 1) * influence;
}

function slope(x, z, feature) {
  const direction = feature.direction ?? [1, 0];
  const gradient = feature.gradient ?? 0.1;

  return (
    x * direction[0] +
    z * direction[1]
  ) * gradient;
}

const FEATURE_GENERATORS = {
  hill,
  valley,
  ridge,
  slope,
};

export function getTerrainHeight(x, z, terrain) {
  let height = terrain.baseHeight ?? 0;

  for (const feature of terrain.features ?? []) {
    const generator = FEATURE_GENERATORS[feature.type];

    if (!generator) continue;

    height += generator(x, z, feature);
  }

  return height;
}
