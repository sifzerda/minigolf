// src/ecs/systems/SurfaceSystem.js

import { surfaceQuery, rampQuery } from "../world.js";
import { getTerrainSurface } from "../../terrain/TerrainRegions.js";
import { PHYSICS } from "../constants/physics.js";

const EPSILON = 1e-6;

let activeTerrain = null;

export function setActiveTerrain(terrain) {
  activeTerrain = terrain ?? null;
}

// Check whether a point lies on a polygon edge.
function pointOnSegment(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];

  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared < EPSILON) {
    return (Math.hypot(x - a[0], z - a[1]) <= EPSILON);
  }

  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lengthSquared));
  const closestX = a[0] + t * dx;
  const closestZ = a[1] + t * dz;

  return (Math.hypot(x - closestX, z - closestZ) <= EPSILON);
}

// Ray-casting point-in-polygon test.
function pointInPolygon(x, z, points) {
  if (!Array.isArray(points) || points.length < 3) {
    return false;
  }

  let inside = false;

  for (
    let i = 0, j = points.length - 1;
    i < points.length;
    j = i++
  ) {
    const a = points[i];
    const b = points[j];

    if (pointOnSegment(x, z, a, b)) {
      return true;
    }

    const intersects = (a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0];

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

// Rectangular surface detection.
// Regular surfaces use [width, length].
// Ramps use [width, height, length].
function containsRectangle(entity, position, isRamp = false) {
  if (!Array.isArray(entity.position) || !Array.isArray(entity.size)) {
    return false;
  }

  const [x, , z] = entity.position;
  const width = entity.size[0];
  const length = isRamp ? entity.size[2] : entity.size[1];

  if (!Number.isFinite(width) || !Number.isFinite(length)) {
    return false;
  }

  // Account for Y-axis rotation on ramps.
  const angle = isRamp ? entity.angle ?? 0 : 0;

  const dx = position.x - x;
  const dz = position.z - z;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  return (Math.abs(localX) <= width / 2 && Math.abs(localZ) <= length / 2);
}

// Supports polygon and rectangular surfaces.
function containsSurface(entity, position) {
  if (
    Array.isArray(entity.points) && entity.points.length >= 3
  ) {
    return pointInPolygon(position.x, position.z, entity.points);
  }

  return containsRectangle(entity, position);
}

// Return only valid rolling surfaces.
// Water and other hazards are handled separately.
function resolveRollingSurface(surface) {
  if (!surface) return "grass";

  const config = PHYSICS.surfaces[surface];
  
  if (!config || config.hazard) {
    return "grass";
  }

  return surface;
}

export function resolveSurface(position, ground) {
  if (!ground) return "grass";

  // Ramps take priority over regular surfaces.
  for (const ramp of rampQuery) {
    if (
      containsRectangle(ramp, position, true)
    ) {
      return resolveRollingSurface(ramp.surface ?? "grass");
    }
  }

  // Check normal ground surfaces.
  for (const entity of surfaceQuery) {
    const surface = entity.surface ?? entity.type;
    // Hazards are handled by their own systems.
    // They should not change rolling friction.
    const config = PHYSICS.surfaces[surface];

    if (!config || config.hazard) {
      continue;
    }

    if (containsSurface(entity, position)) {
      return resolveRollingSurface(surface);
    }
  }

  // Fall back to procedural terrain.
  if (activeTerrain) {
    return resolveRollingSurface(getTerrainSurface(position.x, position.z, activeTerrain));
  }

  return "grass";
}
