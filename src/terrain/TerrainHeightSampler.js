// src/terrain/TerrainHeightSampler.js

import {
  getCourseHeight,
} from "./TerrainFeatures";

const DEFAULT_PRECISION = 6;
const DEFAULT_MAX_ENTRIES = 100000;

export function createTerrainHeightSampler(
  terrain,
  preparedFeatures,
  {
    precision = DEFAULT_PRECISION,
    maxEntries = DEFAULT_MAX_ENTRIES,
  } = {}
) {
  const cache = new Map();

  let hits = 0;
  let misses = 0;

  function heightAt(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      throw new Error(
        `Invalid terrain coordinates: ${x}, ${z}`
      );
    }

    const key =
      `${x.toFixed(precision)},${z.toFixed(precision)}`;

    if (cache.has(key)) {
      hits++;
      return cache.get(key);
    }

    const height = getCourseHeight(
      x,
      z,
      terrain,
      preparedFeatures
    );

    if (!Number.isFinite(height)) {
      throw new Error(
        `Invalid terrain height at ${x}, ${z}`
      );
    }

    misses++;

    // Evict oldest entry when the cache reaches capacity.
    if (cache.size >= maxEntries) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, height);

    return height;
  }

  function clear() {
    cache.clear();
    hits = 0;
    misses = 0;
  }

  function stats() {
    const total = hits + misses;

    return {
      entries: cache.size,
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
    };
  }

  return {
    heightAt,
    clear,
    stats,
  };
}
