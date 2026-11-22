// src/courses/terrainBricks.js

const ORIGIN_2D = [0, 0];
const ORIGIN_3D = [0, 0, 0];

// --------------------------------------------------
// Terrain height features
// --------------------------------------------------

export const terrainBrick = {
  hill({
    position = ORIGIN_2D,
    radius = 4,
    height = 1,
    ...options
  } = {}) {
    return {
      type: "hill",
      position,
      radius,
      height,
      ...options,
    };
  },

  valley({
    position = ORIGIN_2D,
    radius = 4,
    depth = 1,
    ...options
  } = {}) {
    return {
      type: "valley",
      position,
      radius,
      depth,
      ...options,
    };
  },

  ridge({
    start = [-3, 0],
    end = [3, 0],
    width = 2,
    height = 1,
    ...options
  } = {}) {
    return {
      type: "ridge",
      start,
      end,
      width,
      height,
      ...options,
    };
  },

  plateau({
    position = ORIGIN_2D,
    radius = 4,
    edgeWidth = 1,
    height = 2,
    ...options
  } = {}) {
    return {
      type: "plateau",
      position,
      radius,
      edgeWidth,
      height,
      ...options,
    };
  },

  cliff({
    start = [-4, 0],
    end = [4, 0],
    height = 3,
    sharpness = 0.5,
    ...options
  } = {}) {
    return {
      type: "cliff",
      start,
      end,
      height,
      sharpness,
      ...options,
    };
  },

  slope({
    direction = [1, 0],
    gradient = 0.1,
    ...options
  } = {}) {
    return {
      type: "slope",
      direction,
      gradient,
      ...options,
    };
  },

  splineRidge({
    points,
    width = 3,
    height = 1,
    ...options
  } = {}) {
    return {
      type: "splineRidge",
      points,
      width,
      height,
      ...options,
    };
  },

  splineValley({
    points,
    width = 4,
    edgeWidth = 2,
    depth = 1,
    ...options
  } = {}) {
    return {
      type: "splineValley",
      points,
      width,
      edgeWidth,
      depth,
      ...options,
    };
  },

  bankedPath({
    points,
    width = 4,
    edgeWidth = 1,
    gradient = 0.15,
    ...options
  } = {}) {
    return {
      type: "bankedPath",
      points,
      width,
      edgeWidth,
      gradient,
      ...options,
    };
  },

  // Uses the fairway height-blending support
  // added to Terrain.js in the next section.
  fairway({
    points,
    width = 4,
    shoulder = 2,
    flatten = 0.9,
    targetHeight,
    ...options
  } = {}) {
    return {
      type: "fairway",
      points,
      width,
      shoulder,
      blend: "replace",
      strength: flatten,
      ...(targetHeight !== undefined
        ? { targetHeight }
        : {}),
      ...options,
    };
  },
};

// --------------------------------------------------
// Terrain material regions
// Affects the procedural terrain's surface lookup.
//
// Positions use [x, z], not [x, y, z].
// --------------------------------------------------

export const terrainRegion = {
  rectangle({
    position = ORIGIN_2D,
    size = [4, 4],
    surface = "grass",
  } = {}) {
    return {
      shape: "rectangle",
      position,
      size,
      surface,
    };
  },

  circle({
    position = ORIGIN_2D,
    radius = 3,
    surface = "sand",
  } = {}) {
    return {
      shape: "circle",
      position,
      radius,
      surface,
    };
  },
};

// --------------------------------------------------
// Playable surfaces and water hazards
//
// Positions use [x, y, z].
// --------------------------------------------------

export const surfaceBrick = {
  patch({
    id,
    position = ORIGIN_3D,
    size = [3, 3],
    surface = "sand",
    ...options
  } = {}) {
    return {
      id,
      position,
      size,
      surface,
      ...options,
    };
  },

  lake({
    id,
    position = ORIGIN_3D,
    size,
    points,
    holes = [],
    depth = 0.65,
    respawnPosition,
    color = "#1479a8",
    ...options
  } = {}) {
    if (!size && !points) {
      throw new Error(
        "Lake requires a size or polygon points"
      );
    }

    return {
      id,
      position,
      ...(size ? { size } : {}),
      ...(points ? { points } : {}),
      holes,
      depth,
      surface: "water",
      color,
      ...(respawnPosition
        ? { respawnPosition }
        : {}),
      ...options,
    };
  },
};

// --------------------------------------------------
// Playable course footprint
//
// Pass this to createCourseShape().
// --------------------------------------------------

export function fairwayShape({
  points,
  width = 4,
  widths,
  curved = true,
  wall = {
    height: 0.6,
    thickness: 0.25,
  },
  ...options
} = {}) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error(
      "Fairway shape requires at least two points"
    );
  }

  return {
    ...options,
    type: "path",
    points,
    width,
    ...(widths ? { widths } : {}),
    curved,
    wall,
  };
}

// --------------------------------------------------
// Merge natural geography into an existing course.
//
// Doesn't replace existing features, regions,
// floor sections, walls or obstacles.
// --------------------------------------------------

export function withGeography(
  course,
  {
    features = [],
    regions = [],
    surfaces = [],
  } = {}
) {
  const existingTerrain = course.terrain ?? {};

  return {
    ...course,

    terrain: {
      ...existingTerrain,

      features: [
        ...(existingTerrain.features ?? []),
        ...features.flat(Infinity),
      ],

      regions: [
        ...(existingTerrain.regions ?? []),
        ...regions.flat(Infinity),
      ],
    },

    surfaces: [
      ...(course.surfaces ?? []),
      ...surfaces.flat(Infinity),
    ],
  };
}
