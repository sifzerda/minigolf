// src/terrain/trimeshUtils.js

/**
 * Convert a THREE.BufferGeometry into data suitable
 * for Rapier's <TrimeshCollider args={...} />.
 *
 * Returns:
 *   [Float32Array vertices, Uint32Array indices]
 *
 * Returns null for empty geometry.
 *
 * Throws for invalid geometry, including NaN
 * positions and out-of-range indices.
 *
 * Call once per generated geometry, not
 * on every frame.
 */

// Conversion and validation of geometry for Rapier

export function geometryToTrimeshData(geometry) {
  if (!geometry) return null;

  const position = geometry.getAttribute("position");

  if (!position || position.count === 0) {
    return null;
  }

  const count = position.count;

  if (
    position.itemSize < 3 ||
    count < 3
  ) {
    throw new Error(
      "Trimesh requires at least three 3D vertices"
    );
  }

  // ----------------------------------------------
  // Vertex positions
  // ----------------------------------------------

  let vertices;

  // Fast path for standard, non-interleaved
  // Float32BufferAttribute geometry.
  if (
    !position.isInterleavedBufferAttribute &&
    position.itemSize === 3 &&
    position.array instanceof Float32Array &&
    !position.normalized
  ) {
    // Copy to keep collider data independent
    // from subsequent geometry changes.
    vertices = new Float32Array(position.array);
  } else {
    // Also supports interleaved and other
    // supported BufferAttribute representations.
    vertices = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const offset = i * 3;

      vertices[offset] = position.getX(i);
      vertices[offset + 1] = position.getY(i);
      vertices[offset + 2] = position.getZ(i);
    }
  }

  for (let i = 0; i < vertices.length; i++) {
    if (!Number.isFinite(vertices[i])) {
      throw new Error(
        `Invalid trimesh vertex at float index ${i}: ` +
        vertices[i]
      );
    }
  }

  // ----------------------------------------------
  // Triangle indices
  // ----------------------------------------------

  const index = geometry.getIndex();

  let indices;

  if (index) {
    if (index.count % 3 !== 0) {
      throw new Error(
        "Trimesh index count must be divisible by 3"
      );
    }

    indices = new Uint32Array(index.count);

    for (let i = 0; i < index.count; i++) {
      const value = index.getX(i);

      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value >= count
      ) {
        throw new Error(
          `Invalid trimesh index at ${i}: ${value}`
        );
      }

      indices[i] = value;
    }
  } else {
    // Non-indexed BufferGeometry already
    // stores triangles sequentially.
    if (count % 3 !== 0) {
      throw new Error(
        "Non-indexed trimesh vertex count " +
        "must be divisible by 3"
      );
    }

    indices = Uint32Array.from(
      { length: count },
      (_, i) => i
    );
  }

  if (indices.length === 0) return null;

  return [vertices, indices];
}
