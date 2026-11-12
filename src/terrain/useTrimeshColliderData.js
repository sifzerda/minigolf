// src/terrain/useTrimeshColliderData.js

import { useMemo } from "react";

export function useTrimeshColliderData(geometry) {
  return useMemo(() => {
    if (!geometry) return null;

    const position = geometry.getAttribute("position");

    if (!position || position.count < 3) {
      return null;
    }

    const vertices = new Float32Array(
      position.array
    );

    const indices = geometry.index
      ? new Uint32Array(geometry.index.array)
      : Uint32Array.from(
          { length: position.count },
          (_, index) => index
        );

    if (indices.length < 3) {
      return null;
    }

    return [vertices, indices];
  }, [geometry]);
}
