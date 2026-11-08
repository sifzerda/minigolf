// src/terrain/TerrainMaterials.js

export const TERRAIN_MATERIALS = {
  grass: {
    color: "#548a43",
    roughness: 0.95,
  },

  sand: {
    color: "#d7bd82",
    roughness: 1,
  },

  rock: {
    color: "#777b80",
    roughness: 0.9,
  },

  ice: {
    color: "#a8eaff",
    roughness: 0.15,
  },

  snow: {
    color: "#f1f6fa",
    roughness: 0.85,
  },
};

export function getTerrainMaterial(type) {
  return (
    TERRAIN_MATERIALS[type] ??
    TERRAIN_MATERIALS.grass
  );
}
