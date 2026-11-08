// src/terrain/TerrainRegions.js

const withinRectangle = (x, z, region) => {
  const [cx, cz] = region.position;
  const [width, length] = region.size;

  return (
    Math.abs(x - cx) <= width / 2 &&
    Math.abs(z - cz) <= length / 2
  );
};

const withinCircle = (x, z, region) => {
  const [cx, cz] = region.position;

  return (
    Math.hypot(x - cx, z - cz) <= region.radius
  );
};

const REGION_TESTS = {
  rectangle: withinRectangle,
  circle: withinCircle,
};

export function getTerrainSurface(x, z, terrain) {
  let surface = terrain.defaultSurface ?? "grass";

  for (const region of terrain.regions ?? []) {
    const test = REGION_TESTS[region.shape];

    if (test?.(x, z, region)) {
      surface = region.surface;
    }
  }

  return surface;
}

