// src/ecs/systems/SurfaceSystem.js

import { surfaceQuery, rampQuery } from "../world";

export function resolveSurface(position, ground) {
  if (!ground) return "grass";

  // Ramp surfaces take priority.
  for (const ramp of rampQuery) {
    const [x, , z] = ramp.position;
    const [width, , length] = ramp.size;

    if (
      Math.abs(position.x - x) <= width / 2 &&
      Math.abs(position.z - z) <= length / 2
    ) {
      return ramp.surface ?? "grass";
    }
  }

  // Flat surface regions.
  for (const entity of surfaceQuery) {
    const [x, , z] = entity.position;
    const [width, length] = entity.size;

    if (
      Math.abs(position.x - x) <= width / 2 &&
      Math.abs(position.z - z) <= length / 2
    ) {
      return entity.surface;
    }
  }

  return "grass";
}
