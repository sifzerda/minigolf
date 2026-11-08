// src/ecs/systems/SurfaceSystem.js

import { surfaceQuery, rampQuery } from "../world";
import { getTerrainSurface } from "../../terrain/TerrainRegions";

let activeTerrain = null;

export function setActiveTerrain(terrain) {
  activeTerrain = terrain ?? null;
}

export function resolveSurface(position, ground) {
  if (!ground) return "grass";

  for (const ramp of rampQuery) {
    const [x, , z] = ramp.position;
    const [width, , length] = ramp.size;

    if (Math.abs(position.x - x) <= width / 2 && Math.abs(position.z - z) <= length / 2) {
      return ramp.surface ?? "grass";
    }
  }

  for (const entity of surfaceQuery) {
    const [x, , z] = entity.position;
    const [width, length] = entity.size;

    if (Math.abs(position.x - x) <= width / 2 && Math.abs(position.z - z) <= length / 2) {
      return entity.surface;
    }
  }

  if (activeTerrain) {
    return getTerrainSurface(position.x, position.z, activeTerrain);
  }

  return "grass";
}
