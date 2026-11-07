// src/ecs/constants/environments.js

export const ENVIRONMENTS = {
  garden: {
    background: "#87c9e8",
    ground: "#548a43",
    fog: "#b5d8bf",
    fogNear: 25,
    fogFar: 90,
    ambient: 1.2,
    sun: 2.2,
    decorations: "trees",
  },

  desert: {
    background: "#edc48d",
    ground: "#c8a16a",
    fog: "#edc48d",
    fogNear: 20,
    fogFar: 75,
    ambient: 1.4,
    sun: 2.6,
    decorations: "cactus",
  },

  snow: {
    background: "#c8e7f5",
    ground: "#e2eef2",
    fog: "#dcecf5",
    fogNear: 20,
    fogFar: 70,
    ambient: 1.6,
    sun: 1.8,
    decorations: "pine",
  },

  volcanic: {
    background: "#201b24",
    ground: "#302d32",
    fog: "#39242c",
    fogNear: 15,
    fogFar: 60,
    ambient: 0.65,
    sun: 1.4,
    decorations: "rocks",
  },

  neon: {
    background: "#090d1d",
    ground: "#17203b",
    fog: "#141532",
    fogNear: 15,
    fogFar: 65,
    ambient: 0.8,
    sun: 1.2,
    decorations: "crystals",
  },
};

export function getEnvironment(name = "garden") {
  return ENVIRONMENTS[name] ?? ENVIRONMENTS.garden;
}
