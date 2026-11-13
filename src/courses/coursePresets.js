// src/courses/coursePresets.js

import { createCourseShape } from "./courseBuilder";

const EPS = 1e-6;
const DEFAULT_GRASS = "#328b50";

// ============================================================
// POLYGON HELPERS
// ============================================================

export function roundedPolygon(
  points,
  radius = 0.5,
  steps = 6
) {
  if (!Array.isArray(points) || points.length < 3) {
    return [];
  }

  const result = [];
  const n = points.length;
  const count = Math.max(1, Math.floor(steps));

  for (let i = 0; i < n; i++) {
    const previous = points[(i + n - 1) % n];
    const current = points[i];
    const next = points[(i + 1) % n];

    const ax = previous[0] - current[0];
    const az = previous[1] - current[1];

    const bx = next[0] - current[0];
    const bz = next[1] - current[1];

    const al = Math.hypot(ax, az);
    const bl = Math.hypot(bx, bz);

    if (al < EPS || bl < EPS) {
      result.push([...current]);
      continue;
    }

    const inset = Math.min(
      Math.max(0, radius),
      al * 0.35,
      bl * 0.35
    );

    const start = [
      current[0] + (ax / al) * inset,
      current[1] + (az / al) * inset,
    ];

    const end = [
      current[0] + (bx / bl) * inset,
      current[1] + (bz / bl) * inset,
    ];

    for (let j = 0; j <= count; j++) {
      const t = j / count;
      const u = 1 - t;

      result.push([
        u * u * start[0] +
          2 * u * t * current[0] +
          t * t * end[0],

        u * u * start[1] +
          2 * u * t * current[1] +
          t * t * end[1],
      ]);
    }
  }

  return result;
}

// ============================================================
// ROUNDED COURSE SHAPE
// ============================================================

/**
 * Creates a rounded playable course using the existing
 * createCourseShape() renderer schema.
 */
export function createRoundedCourseShape({
  points,
  radius = 0.5,
  steps = 6,
  color = DEFAULT_GRASS,
  wall = {},
  ...options
}) {
  const outline = roundedPolygon(
    points,
    radius,
    steps
  );

  return {
    ...createCourseShape({
      type: "polygon",
      points: outline,
      color,
      wall,
      ...options,
    }),

    outline,
  };
}

// ============================================================
// ISLAND FLOORS
// ============================================================

/**
 * Creates island floor sections.
 *
 * Accepts:
 *
 * 1. Raw polygon points:
 *    createIslandSections(ISLAND)
 *
 * 2. Existing floor sections:
 *    createIslandSections(islandShape.sections)
 *
 * Both return sections with unique IDs and excludeWater.
 */
export function createIslandSections(
  input,
  {
    id = "island",
    color = DEFAULT_GRASS,
  } = {}
) {
  if (!Array.isArray(input) || !input.length) {
    throw new Error(
      "createIslandSections requires polygon points or floor sections"
    );
  }

  const isPoint = (value) =>
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]);

  const isPolygon = input.every(isPoint);

  let sections;

  if (isPolygon) {
    sections = createCourseShape({
      type: "polygon",
      points: input,
      color,
    }).sections;
  } else {
    const validSections = input.every(
      (section) =>
        section &&
        typeof section === "object" &&
        !Array.isArray(section) &&
        section.type === "floor"
    );

    if (!validSections) {
      throw new Error(
        "Invalid island data: expected polygon points or floor sections"
      );
    }

    sections = input;
  }

  return sections.map((section, index) => ({
    ...section,
    id: `${id}-floor-${index}`,
    excludeWater: true,
  }));
}

// ============================================================
// LAKE SURFACES
// ============================================================

/**
 * Creates a water surface using the existing renderer schema.
 *
 * Supports both:
 *
 * points / holes (original course format)
 * outline / islands (preset format)
 *
 * Preserves water depth, basin, position and respawn.
 */
export function createLakeSurface({
  id = "lake-water",

  points,
  outline,

  holes,
  islands,

  position = [0, 0, 0],

  depth = 0.65,
  color = "#1479a8",
  basinColor = "#52636a",

  respawnPosition,

  ...options
} = {}) {
  const lakePoints = points ?? outline;
  const lakeHoles = holes ?? islands ?? [];

  if (
    !Array.isArray(lakePoints) ||
    lakePoints.length < 3
  ) {
    throw new Error(
      "createLakeSurface requires at least three lake outline points"
    );
  }

  if (!Array.isArray(lakeHoles)) {
    throw new Error(
      "createLakeSurface holes must be an array"
    );
  }

  return {
    ...options,

    id,

    type: "water",
    surface: "water",

    position,

    points: lakePoints,
    holes: lakeHoles,

    depth,
    color,
    basinColor,

    ...(respawnPosition
      ? { respawnPosition }
      : {}),
  };
}
