// src/terrain/TerrainBuilder.js

import * as THREE from "three";
import { getTerrainHeight } from "./TerrainFeatures";

export function buildTerrain(terrain) {
  const {
    width = 30,
    length = 40,
    resolution = 64,
  } = terrain;

  const segments = Math.max(
    2,
    Math.floor(resolution)
  );

  const vertices = [];
  const indices = [];
  const uvs = [];

  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const worldX = (x / segments - 0.5) * width;
      const worldZ = (z / segments - 0.5) * length;

      const y = getTerrainHeight(
        worldX,
        worldZ,
        terrain
      );

      vertices.push(worldX, y, worldZ);
      uvs.push(x / segments, z / segments);
    }
  }

  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * (segments + 1) + x;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;

      // Winding produces upward-facing normals.
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(uvs, 2)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return {
    geometry,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
