// src/terrain/TerrainBuilder.js

import * as THREE from "three";
import polygonClipping from "polygon-clipping";

import {
  triangulateXZ,
  subdivideXZ,
  upwardTriangleIndices,
} from "./PolygonMesh";

import {
  getTerrainHeight,
  prepareTerrainFeatures,
} from "./TerrainFeatures";

import { getTerrainSurface } from "./TerrainRegions";
import { getTerrainMaterial } from "./TerrainMaterials";

const closeRing = (points) => {
  const result = points.map(([x, z]) => [x, z]);

  if (
    result.length >= 3 &&
    (
      result[0][0] !== result.at(-1)[0] ||
      result[0][1] !== result.at(-1)[1]
    )
  ) {
    result.push([...result[0]]);
  }

  return result;
};

function getExteriorPolygons(width, length, sections) {
  const hw = width / 2;
  const hl = length / 2;

  const boundary = [
    [
      closeRing([
        [-hw, -hl],
        [hw, -hl],
        [hw, hl],
        [-hw, hl],
      ]),
    ],
  ];

  const exclusions = sections
    .filter((section) => section.type === "floor")
    .flatMap((section) =>
      section.polygons?.length
        ? section.polygons
        : section.points?.length >= 3
          ? [[closeRing(section.points)]]
          : []
    );

  if (!exclusions.length) return boundary;

  return polygonClipping.difference(
    boundary,
    exclusions
  );
}

export function buildTerrain(
  terrain,
  floorSections = []
) {
  if (!terrain) {
    throw new Error(
      "Terrain configuration is required"
    );
  }

  const {
    width = 30,
    length = 40,
    resolution = 64,
  } = terrain;

  if (
    ![width, length, resolution].every(
      Number.isFinite
    ) ||
    width <= 0 ||
    length <= 0 ||
    resolution < 2
  ) {
    throw new Error(
      "Invalid terrain dimensions"
    );
  }

  const preparedFeatures =
    prepareTerrainFeatures(terrain);

  const polygons = getExteriorPolygons(
    width,
    length,
    floorSections
  );

  const maxEdge = Math.max(
    width / Math.floor(resolution),
    length / Math.floor(resolution)
  );

  const vertices = [];
  const indices = [];
  const uvs = [];
  const colors = [];

  const lookup = new Map();

  function addVertex(point) {
    const x = point.x;
    const z = point.y;

    const key =
      `${x.toFixed(7)},${z.toFixed(7)}`;

    if (lookup.has(key)) {
      return lookup.get(key);
    }

    const y = getTerrainHeight(
      x,
      z,
      terrain,
      preparedFeatures
    );

    if (!Number.isFinite(y)) {
      throw new Error(
        `Invalid terrain height at ${x}, ${z}`
      );
    }

    const index = vertices.length / 3;

    vertices.push(x, y, z);

    uvs.push(
      x / width + 0.5,
      z / length + 0.5
    );

    const color = new THREE.Color(
      getTerrainMaterial(
        getTerrainSurface(x, z, terrain)
      ).color
    );

    colors.push(
      color.r,
      color.g,
      color.b
    );

    lookup.set(key, index);

    return index;
  }

  function addTriangle(a, b, c) {
    const area =
      (b.x - a.x) * (c.y - a.y) -
      (b.y - a.y) * (c.x - a.x);

    if (Math.abs(area) < 1e-12) return;

    const ia = addVertex(a);
    const ib = addVertex(b);
    const ic = addVertex(c);

    upwardTriangleIndices(
      a,
      b,
      c,
      ia,
      ib,
      ic,
      indices
    );
  }

  for (const polygon of polygons) {
    for (const [a, b, c] of triangulateXZ(polygon)) {
      subdivideXZ(
        a,
        b,
        c,
        maxEdge,
        addTriangle
      );
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
