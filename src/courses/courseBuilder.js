// src/courses/courseBuilder.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";

const EPS = 1e-7;
const DEFAULT_COLOR = "#25834a";

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function close(points) {
  const result = [];

  for (const point of points ?? []) {
    if (
      !Array.isArray(point) ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    ) {
      continue;
    }

    const p = [point[0], point[1]];

    if (!result.length || distance(result.at(-1), p) > EPS) {
      result.push(p);
    }
  }

  if (
    result.length > 1 &&
    distance(result[0], result.at(-1)) > EPS
  ) {
    result.push([...result[0]]);
  }

  return result;
}

function disk(x, z, radius, steps = 32) {
  if (!(radius > 0)) return [];

  const count = Math.max(12, Math.floor(steps));

  const points = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;

    return [
      x + Math.cos(angle) * radius,
      z + Math.sin(angle) * radius,
    ];
  });

  return [[close(points)]];
}

function unionPolygons(polygons) {
  const valid = polygons.filter(
    (polygon) => Array.isArray(polygon) && polygon.length
  );

  if (!valid.length) return [];
  if (valid.length === 1) return valid[0];

  return polygonClipping.union(...valid);
}

// --------------------------------------------------
// Legacy helpers
// --------------------------------------------------

export function createPolygonFloor({
  id = "main-floor",
  points,
  y = 0,
  color = DEFAULT_COLOR,
  friction = 0.85,
}) {
  return {
    id,
    type: "floor",
    points,
    y,
    color,
    friction,
  };
}

export function createRectangularFloor({
  id = "main-floor",
  width = 8,
  length = 20,
  x = 0,
  z = 0,
  y = 0,
  color = DEFAULT_COLOR,
}) {
  return createPolygonFloor({
    id,
    y,
    color,
    points: [
      [x - width / 2, z - length / 2],
      [x + width / 2, z - length / 2],
      [x + width / 2, z + length / 2],
      [x - width / 2, z + length / 2],
    ],
  });
}

export function createRamp({
  id,
  x = 0,
  z = 0,
  width = 3,
  length = 4,
  thickness = 0.2,
  angle = 0.2,
  color = "#328b50",
}) {
  const height =
    (length / 2) * Math.sin(Math.abs(angle)) +
    (thickness / 2) * Math.cos(angle);

  return {
    id,
    type: "ramp",
    position: [x, height, z],
    size: [width, thickness, length],
    rotation: [angle, 0, 0],
    color,
    friction: 0.85,
  };
}

export function createWall({
  id,
  position,
  size,
  rotation = [0, 0, 0],
  color = "#795548",
}) {
  return {
    id,
    position,
    size,
    rotation,
    color,
  };
}

export function createPolygonWalls({
  points,
  y = 0,
  height = 0.6,
  thickness = 0.3,
  color = "#795548",
}) {
  const closed = close(points);
  const clean = closed.slice(0, -1);

  return clean.flatMap((point, index) => {
    const next = clean[(index + 1) % clean.length];

    const dx = next[0] - point[0];
    const dz = next[1] - point[1];
    const length = Math.hypot(dx, dz);

    if (length < EPS) return [];

    return [
      createWall({
        id: `boundary-${index}`,
        position: [
          (point[0] + next[0]) / 2,
          y + height / 2,
          (point[1] + next[1]) / 2,
        ],
        size: [length, height, thickness],
        rotation: [0, -Math.atan2(dz, dx), 0],
        color,
      }),
    ];
  });
}

// --------------------------------------------------
// Adaptive spline sampling
// --------------------------------------------------

function adaptiveCurvePoints(
  curve,
  {
    closed = false,
    tolerance = 0.025,
    maxSegmentLength = 0.5,
    maxDepth = 12,
  } = {}
) {
  const result = [];
  const spans = Math.max(1, curve.points?.length ?? 1);

  const pointAt = (t) => {
    const p = curve.getPoint(t);
    return [p.x, p.z];
  };

  function pointSegmentDistance(p, a, b) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lengthSq = dx * dx + dz * dz;

    if (lengthSq < EPS) return distance(p, a);

    const t = Math.max(
      0,
      Math.min(
        1,
        ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) /
        lengthSq
      )
    );

    return distance(p, [
      a[0] + dx * t,
      a[1] + dz * t,
    ]);
  }

  function subdivide(t0, a, t1, b, depth) {
    const tm = (t0 + t1) / 2;
    const tq1 = (3 * t0 + t1) / 4;
    const tq3 = (t0 + 3 * t1) / 4;

    const mid = pointAt(tm);

    const error = Math.max(
      pointSegmentDistance(mid, a, b),
      pointSegmentDistance(pointAt(tq1), a, b),
      pointSegmentDistance(pointAt(tq3), a, b)
    );

    if (
      depth < maxDepth &&
      (error > tolerance ||
        distance(a, b) > maxSegmentLength)
    ) {
      subdivide(t0, a, tm, mid, depth + 1);
      subdivide(tm, mid, t1, b, depth + 1);
      return;
    }

    result.push({ point: b, t: t1 });
  }

  result.push({ point: pointAt(0), t: 0 });

  for (let i = 0; i < spans; i++) {
    const t0 = i / spans;
    const t1 = (i + 1) / spans;

    subdivide(
      t0,
      pointAt(t0),
      t1,
      pointAt(t1),
      0
    );
  }

  if (
    closed &&
    result.length > 1 &&
    distance(result[0].point, result.at(-1).point) < EPS
  ) {
    result.pop();
  }

  return result;
}

// --------------------------------------------------
// Width interpolation anchored to control points
// --------------------------------------------------

function interpolateWidth(t, widths, defaultWidth, closed) {
  if (!Array.isArray(widths) || !widths.length) {
    return Math.max(0.1, defaultWidth);
  }

  if (widths.length === 1) {
    return Math.max(0.1, widths[0]);
  }

  const count = widths.length;

  if (closed) {
    const position = (((t % 1) + 1) % 1) * count;
    const index = Math.floor(position);
    const fraction = position - index;

    const a = widths[index % count];
    const b = widths[(index + 1) % count];

    return Math.max(0.1, a + (b - a) * fraction);
  }

  const position = Math.max(0, Math.min(1, t)) * (count - 1);
  const index = Math.min(Math.floor(position), count - 2);
  const fraction = position - index;

  const a = widths[index];
  const b = widths[index + 1];

  return Math.max(0.1, a + (b - a) * fraction);
}

// --------------------------------------------------
// Robust swept path
// --------------------------------------------------

function createSweptPath(
  sampled,
  {
    width = 4,
    widths = null,
    closed = false,
    capSegments = 16,
  } = {}
) {
  if (sampled.length < 2) return [];

  const pieces = [];

  const points = sampled.map((item) => item.point);

  const sampledWidths = sampled.map((item) =>
    interpolateWidth(item.t, widths, width, closed)
  );

  const segmentCount = closed
    ? points.length
    : points.length - 1;

  for (let i = 0; i < segmentCount; i++) {
    const next = (i + 1) % points.length;

    const a = points[i];
    const b = points[next];

    const length = distance(a, b);

    if (length < EPS) continue;

    const nx = -(b[1] - a[1]) / length;
    const nz = (b[0] - a[0]) / length;

    const wa = sampledWidths[i] / 2;
    const wb = sampledWidths[next] / 2;

    pieces.push([[
      close([
        [a[0] + nx * wa, a[1] + nz * wa],
        [b[0] + nx * wb, b[1] + nz * wb],
        [b[0] - nx * wb, b[1] - nz * wb],
        [a[0] - nx * wa, a[1] - nz * wa],
      ]),
    ]]);
  }

  // Round joins and caps.
  // These also fill gaps at sharp bends.
  for (let i = 0; i < points.length; i++) {
    const isEndpoint =
      !closed && (i === 0 || i === points.length - 1);

    const steps = isEndpoint
      ? Math.max(16, capSegments * 2)
      : Math.max(12, capSegments);

    pieces.push(
      disk(
        points[i][0],
        points[i][1],
        sampledWidths[i] / 2,
        steps
      )
    );
  }

  return unionPolygons(pieces);
}

// --------------------------------------------------
// Shape generation
// --------------------------------------------------

function polygonOf(shape) {
  const {
    type = "polygon",
    points = [],
    width = 4,
  } = shape;

  if (type === "compound") {
    const parts = (shape.parts ?? [])
      .map(polygonOf)
      .filter((part) => part.length);

    if (!parts.length) {
      throw new Error("Compound shape requires parts");
    }

    let result = unionPolygons(parts);

    for (const cutout of shape.cutouts ?? []) {
      const region = polygonOf(cutout);

      if (region.length) {
        result = polygonClipping.difference(
          result,
          region
        );
      }
    }

    return result;
  }

  if (type === "circle") {
    return disk(
      shape.x ?? 0,
      shape.z ?? 0,
      shape.radius ?? width / 2,
      shape.segments ?? 64
    );
  }

  if (type === "capsule") {
    const [a, b] =
      shape.points ?? [[0, -5], [0, 5]];

    return polygonOf({
      ...shape,
      type: "path",
      points: [a, b],
      curved: false,
    });
  }

  if (type === "polygon" || type === "rounded") {
    if (points.length < 3) {
      throw new Error("Polygon needs three points");
    }

    if (type === "polygon") {
      return [[close(points)]];
    }

    const curve = new THREE.CatmullRomCurve3(
      points.map(
        ([x, z]) => new THREE.Vector3(x, 0, z)
      ),
      true,
      "centripetal"
    );

    const sampled = adaptiveCurvePoints(curve, {
      closed: true,
      tolerance: shape.tolerance ?? 0.025,
      maxSegmentLength: shape.maxSegmentLength ?? 0.5,
    });

    return [[close(sampled.map((item) => item.point))]];
  }

  if (type === "path") {
    if (points.length < 2) return [];

    const closed = !!shape.closed;

    const curve = shape.curved
      ? new THREE.CatmullRomCurve3(
        points.map(
          ([x, z]) => new THREE.Vector3(x, 0, z)
        ),
        closed,
        "centripetal"
      )
      : null;

    const sampled = curve
      ? adaptiveCurvePoints(curve, {
        closed,
        tolerance: shape.tolerance ?? 0.025,
        maxSegmentLength:
          shape.maxSegmentLength ?? 0.5,
      })
      : points.map((point, index) => ({
        point: [...point],
        t: closed
          ? index / points.length
          : index / (points.length - 1),
      }));

    return createSweptPath(sampled, {
      width,
      widths: shape.widths,
      closed,
      capSegments: shape.capSegments ?? 16,
    });
  }

  throw new Error(`Unsupported course shape: ${type}`);
}

// --------------------------------------------------
// Public course builders
// --------------------------------------------------

export function createCourseShape(shape) {
  let polygons = polygonOf(shape);

  for (const hole of shape.holes ?? []) {
    const cutout = polygonOf(hole);

    if (cutout.length && polygons.length) {
      polygons = polygonClipping.difference(
        polygons,
        cutout
      );
    }
  }

  const section = {
    id: "main-floor",
    type: "floor",
    polygons,
    y: shape.y ?? 0,
    color: shape.color ?? DEFAULT_COLOR,
    friction: shape.friction ?? 0.85,
  };

  return {
    sections: [section],
    boundaryRings: polygons.flatMap(
      (polygon) => polygon
    ),
    wallStyle: shape.wall ?? {},
  };
}

export function createCourse(config) {
  const { shape, ...rest } = config;

  if (!shape) return config;

  const built = createCourseShape(shape);

  return {
    ...rest,
    shape,
    ...built,
    sections: [
      ...built.sections,
      ...(rest.sections ?? []),
    ],
    walls: rest.walls ?? [],
  };
}

export function createCourseTemplate(defaults) {
  return (overrides = {}) =>
    createCourse({
      ...defaults,
      ...overrides,
      terrain: {
        ...defaults.terrain,
        ...overrides.terrain,
      },
      shape: overrides.shape ?? defaults.shape,
    });
}
