// src/terrain/GeometryCache.js

import * as THREE from "three";

const cache = new Map();
const MAX_BYTES = 32 * 1024 * 1024;

let totalBytes = 0;

export function geometryKey(kind, ...inputs) {
  return `${kind}:${JSON.stringify(inputs)}`;
}

function snapshot(geometry) {
  const attributes = {};
  let bytes = 0;

  for (const name of Object.keys(geometry.attributes)) {
    const attribute = geometry.getAttribute(name);

    const array = attribute.array.slice();

    attributes[name] = {
      array,
      itemSize: attribute.itemSize,
      normalized: attribute.normalized,
    };

    bytes += array.byteLength;
  }

  const indices = geometry.index?.array.slice() ?? null;

  bytes += indices?.byteLength ?? 0;

  return {
    attributes,
    indices,
    bytes,
  };
}

function restore(data) {
  const geometry = new THREE.BufferGeometry();

  for (const [name, attribute] of Object.entries(data.attributes)) {
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(
        attribute.array.slice(),
        attribute.itemSize,
        attribute.normalized
      )
    );
  }

  if (data.indices) {
    geometry.setIndex(
      new THREE.BufferAttribute(data.indices.slice(), 1)
    );
  }

  geometry.computeBoundingSphere();

  return geometry;
}

function evictUntilFits(bytes) {
  while (
    totalBytes + bytes > MAX_BYTES &&
    cache.size > 0
  ) {
    const oldestKey = cache.keys().next().value;
    const oldest = cache.get(oldestKey);

    totalBytes -= oldest.bytes;
    cache.delete(oldestKey);
  }
}

export function cachedGeometry(key, create) {
  const hit = cache.get(key);

  if (hit) {
    // Refresh LRU order.
    cache.delete(key);
    cache.set(key, hit);

    return restore(hit);
  }

  const geometry = create();

  // An empty polygon can legitimately produce no geometry.
  if (!geometry) {
    return null;
  }

  if (!(geometry instanceof THREE.BufferGeometry)) {
    throw new TypeError(
      `cachedGeometry("${key}") expected BufferGeometry`
    );
  }

  const position = geometry.getAttribute("position");

  if (
    !position ||
    position.count === 0 ||
    (geometry.index && geometry.index.count === 0)
  ) {
    geometry.dispose();
    return null;
  }

  const data = snapshot(geometry);

  if (data.bytes <= MAX_BYTES) {
    evictUntilFits(data.bytes);

    cache.set(key, data);
    totalBytes += data.bytes;
  }

  // The caller owns this BufferGeometry.
  return geometry;
}

export function clearGeometryCache() {
  cache.clear();
  totalBytes = 0;
}

export function getGeometryCacheStats() {
  return {
    entries: cache.size,
    bytes: totalBytes,
    maxBytes: MAX_BYTES,
  };
}
