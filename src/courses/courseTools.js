// src/courses/courseTools.js

import { Euler, Quaternion, Vector3 } from "three";

const ZERO = [0, 0, 0];
const EPS = 1e-6;

const isNumber = (n) => Number.isFinite(n);
const isXZ = (p) => Array.isArray(p) && p.length >= 2 && isNumber(p[0]) && isNumber(p[1]);
const isXYZ = (p) => Array.isArray(p) && p.length >= 3 && isNumber(p[0]) && isNumber(p[1]) && isNumber(p[2]);
const validSize = (a, indices = [0, 1, 2]) => Array.isArray(a) && indices.every((i) => isNumber(a[i]) && a[i] > 0);

// --------------------------------------------------
// Bounds helpers
// --------------------------------------------------

function boundsCollector() {
  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity,
  };

  const add = (x, z) => {
    if (!isNumber(x) || !isNumber(z)) return;

    bounds.minX = Math.min(bounds.minX, x);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minZ = Math.min(bounds.minZ, z);
    bounds.maxZ = Math.max(bounds.maxZ, z);
  };

  const addXZ = (p) => {
    if (isXZ(p)) add(p[0], p[1]);
  };

  const addXYZ = (p) => {
    if (isXYZ(p)) add(p[0], p[2]);
  };

  const circle = (x, z, r) => {
    if (isNumber(r) && r >= 0) {
      add(x - r, z - r);
      add(x + r, z + r);
    }
  };

  const rectangle = (position, size, rotation = ZERO) => {
    if (
      !isXYZ(position) || !validSize(size, [0, 2])
    ) {
      return;
    }

    const quaternion = new Quaternion()
      .setFromEuler(new Euler(...rotation));

    const [w, , l] = size;

    for (const x of [-w / 2, w / 2]) {
      for (const z of [-l / 2, l / 2]) {
        const p = new Vector3(x, 0, z)
          .applyQuaternion(quaternion);

        add(position[0] + p.x, position[2] + p.z);
      }
    }
  };

  return {
    bounds,
    add,
    addXZ,
    addXYZ,
    circle,
    rectangle,
  };
}

// --------------------------------------------------
// Brick dimensions
// --------------------------------------------------

function brickSize(part) {
  switch (part.shape ?? "box") {
    case "sphere": {
      const d = 2 * (part.radius ?? 0.5);
      return [d, d, d];
    }

    case "cylinder": {
      const d = 2 * (part.radius ?? 0.5);

      return [
        d,
        part.height ?? 1,
        d,
      ];
    }

    default:
      return part.size ?? [1, 1, 1];
  }
}

// --------------------------------------------------
// Assembly bounds
// --------------------------------------------------

function addAssembly(collector, obstacle) {
  const position = obstacle.position ?? ZERO;

  if (!isXYZ(position)) return;

  const parentQ = new Quaternion()
    .setFromEuler(new Euler(...(obstacle.rotation ?? ZERO)));

  for (const part of obstacle.parts ?? []) {
    const size = brickSize(part);

    if (!validSize(size)) continue;

    const partQ = new Quaternion()
      .setFromEuler(new Euler(...(part.rotation ?? ZERO)));
    const offset = new Vector3(...(part.position ?? ZERO));

    const [w, h, l] = size;

    for (const x of [-w / 2, w / 2]) {
      for (const y of [-h / 2, h / 2]) {
        for (const z of [-l / 2, l / 2]) {
          const v = new Vector3(x, y, z)
            .applyQuaternion(partQ)
            .add(offset)
            .applyQuaternion(parentQ);

          collector.add(
            position[0] + v.x,
            position[2] + v.z
          );
        }
      }
    }
  }
}

// --------------------------------------------------
// Terrain feature bounds
// --------------------------------------------------

function addTerrainFeature(c, feature) {
  const f = feature ?? {};
  const p = f.position;
  const radius = Math.max(0, f.radius ?? 0);
  const rx = Math.max(radius, f.radiusX ?? 0);
  const rz = Math.max(radius, f.radiusZ ?? 0);
  const edge = Math.max(0, f.edgeWidth ?? f.shoulder ?? 0);

  if (isXZ(p)) {
    c.add(p[0] - rx - edge, p[1] - rz - edge);
    c.add(p[0] + rx + edge, p[1] + rz + edge);
  }

  const width = Math.max(0, f.width ?? 0, f.radius ?? 0) / 2 + edge;

  for (const point of f.points ?? []) {
    if (isXZ(point)) {
      c.circle(
        point[0],
        point[1],
        width
      );
    }
  }

  for (const point of [f.start, f.end]) {
    if (isXZ(point)) {
      c.circle(
        point[0],
        point[1],
        width
      );
    }
  }

  // Infinite slopes and one-sided cliffs
  // cannot have finite influence bounds.
}

// --------------------------------------------------
// Full course content bounds
// --------------------------------------------------

export function getCourseContentBounds(
  course,
  { includeFeatures = true } = {}
) {
  const c = boundsCollector();

  for (const point of course.route ?? []) {
    c.addXZ(point);
  }

  // Course sections
  for (const section of course.sections ?? []) {
    if (section.type === "floor") {
      if (section.polygons) {
        for (const polygon of section.polygons) {
          for (const ring of polygon) {
            for (const point of ring) {
              c.addXZ(point);
            }
          }
        }
      } else {
        for (const point of section.points ?? []) {
          c.addXZ(point);
        }
      }
    } else {
      const size = section.size ?? [
        section.width ?? 1,
        section.height ?? 0.2,
        section.length ?? 1,
      ];

      c.rectangle(
        section.position ?? [
          0,
          section.y ?? 0,
          0,
        ],
        size,
        section.rotation
      );
    }
  }

  // Perimeter boundaries
  for (const ring of course.boundaryRings ?? []) {
    for (const point of ring) {
      c.addXZ(point);
    }
  }

  // Walls
  for (const wall of course.walls ?? []) {
    c.rectangle(
      wall.position,
      wall.size ?? [
        wall.length ?? 1,
        wall.height ?? 0.8,
        wall.thickness ?? 0.2,
      ],
      wall.rotation
    );
  }

  // Ramps
  for (const ramp of course.ramps ?? []) {
    c.rectangle(
      ramp.position,
      ramp.size ?? [2, 0.5, 2],
      ramp.rotation ?? [
        0,
        ramp.angle ?? 0,
        0,
      ]
    );
  }

  // Surfaces and water
  for (const surface of course.surfaces ?? []) {
    for (const point of surface.points ?? []) {
      c.addXZ(point);
    }

    for (const ring of surface.holes ?? []) {
      const points = Array.isArray(ring)
        ? ring
        : ring.points ?? [];

      for (const point of points) {
        c.addXZ(point);
      }
    }

    if (
      surface.size &&
      isXYZ(surface.position)
    ) {
      c.rectangle(
        surface.position,
        [
          surface.size[0],
          0,
          surface.size[1],
        ],
        surface.rotation
      );
    }
  }

  // Obstacles
  for (const obstacle of course.obstacles ?? []) {
    c.addXYZ(obstacle.position);
    c.addXZ(obstacle.start);
    c.addXZ(obstacle.end);

    if (
      obstacle.type === "assembly" ||
      obstacle.parts?.length
    ) {
      addAssembly(c, obstacle);
      continue;
    }

    // Moving obstacles
    if (
      ["movingBarrier", "movingPlatform"]
        .includes(obstacle.type) &&
      isXYZ(obstacle.position)
    ) {
      const size =
        obstacle.size ?? [2, 0.6, 0.3];

      const distance = Math.max(
        0,
        obstacle.distance ?? 2
      );

      const axis =
        obstacle.type === "movingBarrier"
          ? "x"
          : obstacle.axis ?? "x";

      for (const side of [-1, 1]) {
        const moved = [...obstacle.position];

        if (axis === "x") {
          moved[0] += side * distance;
        }

        if (axis === "z") {
          moved[2] += side * distance;
        }

        c.rectangle(
          moved,
          size,
          obstacle.rotation
        );
      }

      continue;
    }

    // Bridges, tunnels and elevated paths
    if (
      ["bridge", "tunnel", "elevatedPath"]
        .includes(obstacle.type)
    ) {
      const [width, height, length] =
        obstacle.size ?? [3, 0.25, 6];

      const extra =
        obstacle.ramps === true
          ? Math.max(
              0,
              obstacle.rampLength ?? 3
            )
          : 0;

      c.rectangle(
        obstacle.position,
        [
          Math.max(
            width,
            obstacle.rampWidth ?? 0
          ),
          height,
          length + extra * 2,
        ],
        obstacle.rotation
      );

      continue;
    }

    // Explicit layout bounds
    if (
      obstacle.layoutBounds &&
      isXYZ(obstacle.position)
    ) {
      const [w, l] = obstacle.layoutBounds;

      c.rectangle(
        obstacle.position,
        [w, 1, l],
        obstacle.rotation ?? [
          0,
          obstacle.angle ?? 0,
          0,
        ]
      );
    } else if (obstacle.size?.length >= 3) {
      c.rectangle(
        obstacle.position,
        obstacle.size,
        obstacle.rotation ?? [
          0,
          obstacle.angle ?? 0,
          0,
        ]
      );
    } else if (
      isXYZ(obstacle.position) &&
      isNumber(obstacle.radius)
    ) {
      c.circle(
        obstacle.position[0],
        obstacle.position[2],
        obstacle.radius
      );
    }
  }

  // Terrain features and surface regions
  if (includeFeatures) {
    for (const feature of
      course.terrain?.features ?? []) {
      addTerrainFeature(c, feature);
    }

    for (const region of
      course.terrain?.regions ?? []) {
      if (!isXZ(region.position)) {
        continue;
      }

      if (region.shape === "circle") {
        c.circle(
          region.position[0],
          region.position[1],
          region.radius ?? 0
        );
      } else if (
        region.shape === "rectangle" &&
        validSize(region.size, [0, 1])
      ) {
        const [x, z] = region.position;

        c.add(
          x - region.size[0] / 2,
          z - region.size[1] / 2
        );

        c.add(
          x + region.size[0] / 2,
          z + region.size[1] / 2
        );
      }
    }
  }

  c.addXYZ(course.ballStart);
  c.addXYZ(course.hole?.position);

  return Number.isFinite(c.bounds.minX)
    ? c.bounds
    : null;
}

// --------------------------------------------------
// Automatic terrain sizing
// --------------------------------------------------

export function autoSizeTerrain(
  course,
  {
    padding = 4,
    roundTo = 2,
    shrink = false,
    includeFeatures = true,
    maxDimension = 1000,
  } = {}
) {
  if (
    ![padding, roundTo, maxDimension]
      .every(isNumber) ||
    padding < 0 ||
    roundTo <= 0 ||
    maxDimension <= 0
  ) {
    throw new Error(
      "Invalid automatic terrain sizing options"
    );
  }

  const bounds = getCourseContentBounds(
    course,
    { includeFeatures }
  );

  if (!bounds) return course;

  const terrain = course.terrain ?? {};

  // Terrain is centred at world X=0 and Z=0.
  const widthNeeded =
    2 * Math.max(
      Math.abs(bounds.minX),
      Math.abs(bounds.maxX)
    ) + 2 * padding;

  const lengthNeeded =
    2 * Math.max(
      Math.abs(bounds.minZ),
      Math.abs(bounds.maxZ)
    ) + 2 * padding;

  const roundUp = (n) =>
    Math.ceil(n / roundTo) * roundTo;

  const width = roundUp(
    Math.max(
      2,
      widthNeeded,
      shrink ? 0 : (terrain.width ?? 30)
    )
  );

  const length = roundUp(
    Math.max(
      2,
      lengthNeeded,
      shrink ? 0 : (terrain.length ?? 40)
    )
  );

  if (
    width > maxDimension ||
    length > maxDimension
  ) {
    throw new Error(
      `Terrain ${width}×${length} exceeds the ` +
      `${maxDimension}-unit limit`
    );
  }

  return {
    ...course,

    terrain: {
      ...terrain,
      width,
      length,
    },
  };
}

// --------------------------------------------------
// Point-in-polygon helpers
// --------------------------------------------------

function pointOnSegment(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];

  const cross =
    (x - a[0]) * dz -
    (z - a[1]) * dx;

  if (
    Math.abs(cross) >
    EPS * Math.max(
      1,
      Math.hypot(dx, dz)
    )
  ) {
    return false;
  }

  const dot =
    (x - a[0]) * dx +
    (z - a[1]) * dz;

  return (
    dot >= -EPS &&
    dot <= dx * dx + dz * dz + EPS
  );
}

function inRing(x, z, ring) {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const a = ring[i];
    const b = ring[j];

    if (!isXZ(a) || !isXZ(b)) {
      continue;
    }

    if (pointOnSegment(x, z, a, b)) {
      return true;
    }

    if (
      (a[1] > z) !== (b[1] > z) &&
      x <
        (b[0] - a[0]) *
        (z - a[1]) /
        (b[1] - a[1]) +
        a[0]
    ) {
      inside = !inside;
    }
  }

  return inside;
}

function inFloors(x, z, sections) {
  for (const section of sections ?? []) {
    if (section.type !== "floor") {
      continue;
    }

    const polygons =
      section.polygons ??
      (section.points
        ? [[section.points]]
        : []);

    for (const polygon of polygons) {
      if (
        !polygon.length ||
        !inRing(x, z, polygon[0])
      ) {
        continue;
      }

      if (
        polygon.slice(1).some(
          (hole) => inRing(x, z, hole)
        )
      ) {
        continue;
      }

      return true;
    }
  }

  return false;
}

// --------------------------------------------------
// Course validation
// --------------------------------------------------

export function validateCourse(
  course,
  {
    checkFloorPositions = true,
  } = {}
) {
  const errors = [];
  const warnings = [];

  const error = (message) =>
    errors.push(message);

  const warn = (message) =>
    warnings.push(message);

  if (
    !course ||
    typeof course !== "object"
  ) {
    return {
      valid: false,
      errors: [
        "Course is not an object",
      ],
      warnings,
    };
  }

  // Required course data
  if (
    course.id == null ||
    course.id === ""
  ) {
    error("Missing course.id");
  }

  if (!isXYZ(course.ballStart)) {
    error(
      "ballStart must be a finite [x,y,z]"
    );
  }

  if (!isXYZ(course.hole?.position)) {
    error(
      "hole.position must be a finite [x,y,z]"
    );
  }

  if (
    !isNumber(course.hole?.radius) ||
    course.hole.radius <= 0
  ) {
    error(
      "hole.radius must be positive"
    );
  }

  if (
    !Array.isArray(course.sections) ||
    !course.sections.length
  ) {
    error(
      "Course has no playable sections"
    );
  }

  // Terrain dimensions
  const terrain = course.terrain;

  if (terrain) {
    if (
      !isNumber(terrain.width) ||
      terrain.width <= 0
    ) {
      error(
        "terrain.width must be positive"
      );
    }

    if (
      !isNumber(terrain.length) ||
      terrain.length <= 0
    ) {
      error(
        "terrain.length must be positive"
      );
    }

    if (
      terrain.resolution !== undefined &&
      (
        !isNumber(terrain.resolution) ||
        terrain.resolution < 2
      )
    ) {
      error(
        "terrain.resolution must be at least 2"
      );
    }
  }

  // Validate floor polygons
  for (
    const [index, section] of
    (course.sections ?? []).entries()
  ) {
    if (section.type !== "floor") {
      continue;
    }

    const polygons =
      section.polygons ??
      (section.points
        ? [[section.points]]
        : []);

    if (!polygons.length) {
      error(
        `sections[${index}] has no floor polygon`
      );
    }

    for (const polygon of polygons) {
      if (
        !polygon[0] ||
        polygon[0].length < 3 ||
        !polygon[0].every(isXZ)
      ) {
        error(
          `sections[${index}] has an invalid outer ring`
        );
      }
    }
  }

  // Duplicate IDs and assembly validation
  for (const group of [
    "sections",
    "walls",
    "obstacles",
    "surfaces",
    "ramps",
  ]) {
    const ids = new Set();

    for (
      const [index, item] of
      (course[group] ?? []).entries()
    ) {
      if (
        item.id !== undefined &&
        item.id !== null
      ) {
        if (ids.has(item.id)) {
          warn(
            `${group} contains duplicate id: ${item.id}`
          );
        }

        ids.add(item.id);
      }

      if (
        group === "obstacles" &&
        item.type === "assembly"
      ) {
        if (!isXYZ(item.position)) {
          error(
            `obstacles[${index}] assembly has invalid position`
          );
        }

        if (!item.parts?.length) {
          error(
            `obstacles[${index}] assembly has no bricks`
          );
        }

        for (
          const [i, part] of
          (item.parts ?? []).entries()
        ) {
          if (!validSize(brickSize(part))) {
            error(
              `obstacles[${index}].parts[${i}] has invalid dimensions`
            );
          }

          if (
            part.position !== undefined &&
            !isXYZ(part.position)
          ) {
            error(
              `obstacles[${index}].parts[${i}] has invalid position`
            );
          }
        }
      }
    }
  }

  // Check ball and hole positions
  const floors = (course.sections ?? [])
    .filter((section) =>
      section.type === "floor"
    );

  if (
    checkFloorPositions &&
    floors.length
  ) {
    if (
      isXYZ(course.ballStart) &&
      !inFloors(
        course.ballStart[0],
        course.ballStart[2],
        floors
      )
    ) {
      warn(
        "Ball start is outside the playable floor"
      );
    }

    if (
      isXYZ(course.hole?.position) &&
      !inFloors(
        course.hole.position[0],
        course.hole.position[2],
        floors
      )
    ) {
      warn(
        "Hole centre is outside the playable floor"
      );
    }
  }

  // Check terrain coverage
  if (
    terrain &&
    terrain.width > 0 &&
    terrain.length > 0
  ) {
    const bounds =
      getCourseContentBounds(course);

    if (
      bounds &&
      (
        bounds.minX <
          -terrain.width / 2 - EPS ||
        bounds.maxX >
          terrain.width / 2 + EPS ||
        bounds.minZ <
          -terrain.length / 2 - EPS ||
        bounds.maxZ >
          terrain.length / 2 + EPS
      )
    ) {
      warn(
        "Course content extends beyond centred terrain bounds; " +
        "use autoSizeTerrain()"
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// --------------------------------------------------
// Development reporting
// --------------------------------------------------

export function reportCourseIssues(
  course,
  options
) {
  const report = validateCourse(
    course,
    options
  );

  const label = course?.id ?? "unknown";

  for (const message of report.errors) {
    console.error(
      `[${label}] ${message}`
    );
  }

  for (const message of report.warnings) {
    console.warn(
      `[${label}] ${message}`
    );
  }

  return report;
}
