// src/terrain/useTerrainGeometry.js

import { useEffect, useMemo } from "react";

// Geometry is owned by the component that creates it. It is never
// disposed by a global cache while another component is using it.
export function useTerrainGeometry(factory, dependencies) {
  const geometry = useMemo(factory, dependencies);

  useEffect(() => {
    return () => geometry?.dispose();
  }, [geometry]);

  const colliderData = useMemo(() => {
    if (!geometry) return null;
    const position = geometry.getAttribute("position");
    if (!position || position.count < 3) return null;

    const vertices = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      vertices[i * 3] = position.getX(i);
      vertices[i * 3 + 1] = position.getY(i);
      vertices[i * 3 + 2] = position.getZ(i);
    }

    const index = geometry.getIndex();
    const indices = index
      ? Uint32Array.from(index.array)
      : Uint32Array.from({ length: position.count }, (_, i) => i);

    return indices.length >= 3 ? [vertices, indices] : null;
  }, [geometry]);

  return { geometry, colliderData };
}
