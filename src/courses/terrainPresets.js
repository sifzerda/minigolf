// src/courses/terrainPresets.js

const point = (value, name) => {
  if (!Array.isArray(value) || value.length !== 2 ||
      !value.every(Number.isFinite)) {
    throw new TypeError(`${name} must be a finite [x, z] pair`);
  }
  return [...value];
};

const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
  return value;
};

const finite = (value, name) => {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be finite`);
  }
  return value;
};

const extra = (options, excluded) => Object.fromEntries(
  Object.entries(options).filter(([key]) => !excluded.includes(key))
);

// Uses position, radius, height and optional falloff/blend/strength.
export function hill({ position = [0, 0], radius = 3, height = 1, ...rest } = {}) {
  return { type: 'hill', position: point(position, 'position'),
    radius: positive(radius, 'radius'), height: finite(height, 'height'), ...rest };
}

export function valley({ position = [0, 0], radius = 3, depth = 1, ...rest } = {}) {
  return { type: 'valley', position: point(position, 'position'),
    radius: positive(radius, 'radius'), depth: finite(depth, 'depth'), ...rest };
}

export function deformation({ position = [0, 0], radiusX = 3, radiusZ = 3,
  height = 1, ...rest } = {}) {
  return { type: 'deformation', position: point(position, 'position'),
    radiusX: positive(radiusX, 'radiusX'), radiusZ: positive(radiusZ, 'radiusZ'),
    height: finite(height, 'height'), ...rest };
}

// Ridge is a line segment; existing engine expects start/end, not from/to.
export function ridge({ start = [-2, 0], end = [2, 0], width = 3,
  height = 1, ...rest } = {}) {
  return { type: 'ridge', start: point(start, 'start'), end: point(end, 'end'),
    width: positive(width, 'width'), height: finite(height, 'height'), ...rest };
}

export function plateau({ position = [0, 0], radius = 5, height = 2,
  edgeWidth = 2, ...rest } = {}) {
  return { type: 'plateau', position: point(position, 'position'),
    radius: positive(radius, 'radius'), height: finite(height, 'height'),
    edgeWidth: positive(edgeWidth, 'edgeWidth'), ...rest };
}

export function cliff({ start = [-2, 0], end = [2, 0], height = 3,
  sharpness = 0.5, ...rest } = {}) {
  return { type: 'cliff', start: point(start, 'start'), end: point(end, 'end'),
    height: finite(height, 'height'), sharpness: positive(sharpness, 'sharpness'), ...rest };
}

export function slope({ direction = [1, 0], gradient = 0.1, ...rest } = {}) {
  return { type: 'slope', direction: point(direction, 'direction'),
    gradient: finite(gradient, 'gradient'), ...rest };
}

// For splinePath/splineRidge/splineValley/bankedPath, use the existing
// Terrain.js shape: points, width, edgeWidth, height/depth, etc.
export function splineFeature(type, { points, ...rest } = {}) {
  const supported = ['splinePath', 'splineRidge', 'splineValley', 'bankedPath'];
  if (!supported.includes(type)) throw new Error(`Unsupported spline type: ${type}`);
  if (!Array.isArray(points) || points.length < 2) {
    throw new TypeError('Spline requires at least two points');
  }
  return { type, points: points.map((p, i) => point(p, `points[${i}]`)), ...rest };
}

// Compose feature arrays without changing order (important for blend modes).
export function terrainFeatures(...groups) {
  return groups.flat(Infinity).filter((feature) => feature != null);
}

// Preserve all existing terrain settings while replacing or appending features.
export function withTerrainFeatures(terrain, features, { append = true } = {}) {
  return {
    ...terrain,
    features: append
      ? [...(terrain?.features ?? []), ...terrainFeatures(features)]
      : terrainFeatures(features),
  };
}
