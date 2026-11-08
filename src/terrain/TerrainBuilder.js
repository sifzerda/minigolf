// src/terrain/TerrainBuilder.js

import * as THREE from "three";

import {
  getTerrainHeight,
  prepareTerrainFeatures,
} from "./TerrainFeatures";

import { getTerrainSurface } from "./TerrainRegions";
import { getTerrainMaterial } from "./TerrainMaterials";

export function buildTerrain(terrain) {
  if (!terrain) {
    throw new Error("Terrain configuration is required");
  }

  const {
    width = 30,
    length = 40,
    resolution = 64,
  } = terrain;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length) ||
    !Number.isFinite(resolution) ||
    width <= 0 ||
    length <= 0
  ) {
    throw new Error("Invalid terrain dimensions");
  }

  const segments = Math.max(2, Math.floor(resolution));

  const preparedFeatures = prepareTerrainFeatures(terrain);

  const vertices = [];
  const indices = [];
  const uvs = [];
  const colors = [];

  const stride = segments + 1;

  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const worldX = (x / segments - 0.5) * width;
      const worldZ = (z / segments - 0.5) * length;

      const y = getTerrainHeight(
        worldX,
        worldZ,
        terrain,
        preparedFeatures
      );

      if (!Number.isFinite(y)) {
        throw new Error(
          `Invalid terrain height at ${worldX}, ${worldZ}`
        );
      }

      vertices.push(worldX, y, worldZ);
      uvs.push(x / segments, z / segments);

      const surface = getTerrainSurface(
        worldX,
        worldZ,
        terrain
      );

      const material = getTerrainMaterial(surface);
      const color = new THREE.Color(material.color);

      colors.push(color.r, color.g, color.b);
    }
  }

  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;

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

  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
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
