import { Vector3 } from "three";
import { BALL_RADIUS } from "../ecs/constants/physics.js";

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

function intersectXZ(a, b, c, d) {
  const rx = b.x - a.x;
  const rz = b.z - a.z;
  const sx = d.x - c.x;
  const sz = d.z - c.z;
  const det = rx * sz - rz * sx;

  if (Math.abs(det) < 1e-8) return null;

  const qx = c.x - a.x;
  const qz = c.z - a.z;
  const u = (qx * sz - qz * sx) / det;
  const v = (qx * rz - qz * rx) / det;

  return u > 1e-4 && u < 1 - 1e-4 && v > 1e-4 && v < 1 - 1e-4
    ? [u, v]
    : null;
}

function bump(distance, center, height, rampLength, flatLength) {
  const d = Math.abs(distance - center) - flatLength / 2;
  if (d <= 0) return height;
  if (d >= rampLength) return 0;
  return height * (1 - smoothstep(d / rampLength));
}

/**
 * Returns one continuous 3D centreline. All distances are world units.
 * The exact same path can be used to generate geometry and course previews.
 *
 * loops: number of full 360-degree turns
 * loopSpacing: forward/lateral progress PER turn
 * betweenLength: straight track between consecutive turns
 * approachLength/departureLength: entrance/exit straight lengths
 */
export function createLoopPath(entity, mode = entity.type) {
  const vertical = mode === "verticalLoop";
  const inclined = mode === "inclinedLoop";
  const loops = clamp(Math.floor(entity.loops ?? entity.loopCount ?? 1), 1, 8);
  const segments = clamp(Math.floor(entity.segmentsPerLoop ?? entity.segments ?? 96), 48, 192);
  const radius = Math.max(0.8, entity.radius ?? 1.6);
  const width = Math.max(0.65, entity.width ?? 1.3);
  const railHeight = Math.max(0.08, entity.railHeight ?? 0.3);
  const groundY = entity.groundY ?? 0.04;
  const between = Math.max(0, entity.betweenLength ?? 0);
  const approach = Math.max(0, entity.approachLength ?? 1.5);
  const departure = Math.max(0, entity.departureLength ?? 1.5);
  const spacing = Math.max(
    width + 2 * BALL_RADIUS + 0.45,
    entity.loopSpacing ?? entity.exitOffset ?? 3.6
  );
  const rise = inclined ? Math.max(0.25, entity.rise ?? 1.1) : 0;
  const verticalForward = entity.verticalAdvance === "forward";

  // Unit tangent along the start and end of every complete turn.
  // "x"-drifting vertical loops retain the original layout by default.
  const tangent = vertical && verticalForward
    ? new Vector3(0, 0, -1)
    : new Vector3(spacing, 0, -TAU * radius).normalize();

  const core = [];
  const turnsAt = [];
  let origin = new Vector3(0, groundY, 0);

  function add(point, turn) {
    core.push(point);
    turnsAt.push(turn);
  }

  for (let turn = 0; turn < loops; turn++) {
    for (let j = turn === 0 ? 0 : 1; j <= segments; j++) {
      const u = j / segments;
      const a = TAU * u;
      const drift = spacing * u;
      const y = groundY +
        (vertical ? radius * (1 - Math.cos(a)) : 0) +
        rise * smoothstep((turn + u) / loops);

      add(new Vector3(
        origin.x + (vertical && verticalForward ? 0 : drift + (vertical ? 0 : radius * (1 - Math.cos(a)))),
        y,
        origin.z - radius * Math.sin(a) - (vertical && verticalForward ? drift : 0)
      ), turn + u);
    }

    const last = core.at(-1);

    if (turn < loops - 1 && between > 0) {
      const count = Math.max(1, Math.ceil(between / 0.35));
      for (let j = 1; j <= count; j++) {
        add(last.clone().addScaledVector(tangent, between * j / count), turn + 1);
      }
    }

    // Keep the next turn's origin at this turn's new endpoint.
    const end = core.at(-1);
    origin = new Vector3(end.x, groundY, end.z);
  }

  const countIn = Math.max(0, Math.ceil(approach / 0.35));
  const countOut = Math.max(0, Math.ceil(departure / 0.35));
  const first = core[0];
  const last = core.at(-1);
  const path = [];
  const progress = [];

  for (let j = countIn; j >= 1; j--) {
    path.push(first.clone().addScaledVector(tangent, -approach * j / countIn));
    progress.push(-j / countIn);
  }

  path.push(...core);
  progress.push(...turnsAt);

  for (let j = 1; j <= countOut; j++) {
    const t = j / countOut;
    const p = last.clone().addScaledVector(tangent, departure * t);
    if (inclined) p.y -= rise * smoothstep(t);
    path.push(p);
    progress.push(loops + t);
  }

  // Arc length is more reliable than parameter t for placing smooth ramps.
  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    distances.push(distances[i - 1] + path[i].distanceTo(path[i - 1]));
  }

  const overpasses = [];
  const defaultHeight = Math.max(
    entity.overpassHeight ?? 1.7,
    2 * BALL_RADIUS + railHeight + (entity.overpassClearance ?? 0.45)
  );
  const rampLength = Math.max(1, entity.overpassRampLength ?? 3.5);
  const flatLength = Math.max(0, entity.overpassFlatLength ?? 1);

  if (!vertical && entity.autoOverpass === true) {
    for (let i = 0; i < path.length - 1; i++) {
      for (let j = i + 2; j < path.length - 1; j++) {
        if (distances[j] - distances[i + 1] < width * 2.5) continue;
        const intersection = intersectXZ(path[i], path[i + 1], path[j], path[j + 1]);
        if (!intersection) continue;
        const [a, b] = intersection;
        const s = distances[i] + a * (distances[i + 1] - distances[i]);
        const earlierY = path[i].y + a * (path[i + 1].y - path[i].y);
        const laterY = path[j].y + b * (path[j + 1].y - path[j].y);
        overpasses.push({
          distance: s,
          height: Math.max(defaultHeight, defaultHeight + laterY - earlierY),
          rampLength,
          flatLength,
        });
      }
    }
  }

  for (const bridge of entity.overpasses ?? []) {
    const turn = clamp(bridge.turn ?? 0.5, 0, loops);
    const index = progress.findIndex((value) => value >= turn);
    overpasses.push({
      distance: distances[Math.max(0, index)],
      height: Math.max(defaultHeight, bridge.height ?? defaultHeight),
      rampLength: Math.max(1, bridge.rampLength ?? rampLength),
      flatLength: Math.max(0, bridge.flatLength ?? flatLength),
    });
  }

  for (let i = 0; i < path.length; i++) {
    const t = progress[i] / loops;
    let lift = 0;

    // Preserve the original Course 09 overpass configuration.
    if (!vertical && entity.overpass === true) {
      const start = entity.overpassStart ?? 0.02;
      const peak = entity.overpassPeak ?? 0.315;
      const end = entity.overpassEnd ?? 0.64;
      if (start < peak && peak < end && t > start && t < end) {
        lift = defaultHeight * (t <= peak
          ? smoothstep((t - start) / (peak - start))
          : 1 - smoothstep((t - peak) / (end - peak)));
      }
    }

    for (const bridge of overpasses) {
      lift = Math.max(lift, bump(
        distances[i], bridge.distance, bridge.height,
        bridge.rampLength, bridge.flatLength
      ));
    }

    path[i].y += lift;
  }

  return path;
}
