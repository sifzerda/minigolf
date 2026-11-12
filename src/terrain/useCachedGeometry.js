// src/terrain/useCachedGeometry.js

import { useEffect, useMemo } from "react";

import {
  cachedGeometry,
} from "./GeometryCache";

export function useCachedGeometry(
  key,
  factory
) {
  const geometry = useMemo(
    () => cachedGeometry(key, factory),
    [key]
  );

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  return geometry;
}
