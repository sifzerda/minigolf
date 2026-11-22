// src/courses/courseConstruction.js

import { Euler, Quaternion, Vector3 } from "three";
import { createTerrain } from "../terrain/Terrain.js";
import {
  brick,
  assembly,
  buildStaticAssembly,
} from "./bricks.js";

const ZERO = [0, 0, 0];
const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);

const STATIC_TYPES = new Set([
  "assembly",
  "bridge",
  "tunnel",
  "elevatedPath",
]);

const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be positive`);
  }
  return value;
};

// --------------------------------------------------
// Primitive vertices for layout calculations
// --------------------------------------------------

function brickVertices(part) {
  const shape = part.shape ?? "box";

  if (shape === "sphere") {
    const r = positive(part.radius ?? 0.5, "Sphere radius");
    const points = [];

    // Sample the sphere for placement bounds.
    for (let j = 0; j <= 8; j++) {
      const phi = Math.PI * j / 8;

      for (let i = 0; i < 16; i++) {
        const angle = Math.PI * 2 * i / 16;

        points.push([
          r * Math.sin(phi) * Math.cos(angle),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(angle),
        ]);
      }
    }

    return points;
  }

  if (shape === "cylinder") {
    const r = positive(part.radius ?? 0.5, "Cylinder radius");
    const h = positive(part.height ?? 1, "Cylinder height");

    return [-h / 2, h / 2].flatMap((y) =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = Math.PI * 2 * i / 16;

        return [
          r * Math.cos(angle),
          y,
          r * Math.sin(angle),
        ];
      })
    );
  }

  const [w, h, l] = part.size ?? [1, 1, 1];

  positive(w, "Brick width");
  positive(h, "Brick height");
  positive(l, "Brick length");

  if (shape === "pyramid") {
    return [
      [-w / 2, -h / 2, -l / 2],
      [w / 2, -h / 2, -l / 2],
      [w / 2, -h / 2, l / 2],
      [-w / 2, -h / 2, l / 2],
      [0, h / 2, 0],
    ];
  }

  if (shape === "wedge") {
    return [
      [-w / 2, -h / 2, l / 2],
      [w / 2, -h / 2, l / 2],
      [-w / 2, -h / 2, -l / 2],
      [w / 2, -h / 2, -l / 2],
      [-w / 2, h / 2, -l / 2],
      [w / 2, h / 2, -l / 2],
    ];
  }

  if (shape !== "box") {
    throw new Error(`Unknown brick shape: ${shape}`);
  }

  return [-w / 2, w / 2].flatMap((x) =>
    [-h / 2, h / 2].flatMap((y) =>
      [-l / 2, l / 2].map((z) => [x, y, z])
    )
  );
}

// --------------------------------------------------
// Local assembly bounds
// --------------------------------------------------

function getLocalBounds(entity) {
  let parts;

  if (STATIC_TYPES.has(entity.type)) {
    parts = buildStaticAssembly(entity).parts;
  } else if (entity.type === "block") {
    parts = [{
      shape: "box",
      size: entity.size ?? [1, 0.8, 1],
      position: ZERO,
    }];
  } else {
    throw new Error(
      `Terrain placement does not support ${entity.type}`
    );
  }

  if (!parts?.length) {
    throw new Error("Assembly has no bricks");
  }

  const parentRotation = new Quaternion()
    .setFromEuler(
      new Euler(...(entity.rotation ?? ZERO))
    );

  const points = [];
  let minY = Infinity;

  for (const part of parts) {
    const partRotation = new Quaternion()
      .setFromEuler(
        new Euler(...(part.rotation ?? ZERO))
      );

    const partPosition = new Vector3(
      ...(part.position ?? ZERO)
    );

    for (const coords of brickVertices(part)) {
      const p = new Vector3(...coords)
        .applyQuaternion(partRotation)
        .add(partPosition)
        .applyQuaternion(parentRotation);

      points.push(p);
      minY = Math.min(minY, p.y);
    }
  }

  return { points, minY };
}

// --------------------------------------------------
// Course construction
// --------------------------------------------------

export function createCourseConstruction(terrainConfig) {
  // Prepared only once when the course is created.
  const terrain = createTerrain(terrainConfig ?? {});

  const heightAt = terrain.heightAt;

  /**
   * Position a fixed object relative to the
   * existing procedural terrain.
   *
   * entity.position[1] is treated as an
   * additional height offset.
   *
   * anchor:
   *   "bottom" => lowest brick point rests on ground
   *   "origin" => assembly origin rests on ground
   *
   * sampling:
   *   "center" => height beneath the origin
   *   "highest" => highest sampled footprint height
   */
  function placeOnTerrain(
    entity,
    {
      anchor = "bottom",
      sampling = "center",
      clearance = 0,
    } = {}
  ) {
    if (!["bottom", "origin"].includes(anchor)) {
      throw new Error(`Invalid anchor: ${anchor}`);
    }

    if (!["center", "highest"].includes(sampling)) {
      throw new Error(`Invalid sampling: ${sampling}`);
    }

    // Legacy access ramps calculate their own
    // heights from the original entity position.
    // Use connectWithRamp for terrain-placed objects.
    if (
      (entity.type === "bridge" ||
        entity.type === "elevatedPath") &&
      entity.ramps === true
    ) {
      throw new Error(
        "Use connectWithRamp instead of legacy ramps:true " +
        "for terrain-placed bridges/platforms"
      );
    }

    const [x, offsetY, z] =
      entity.position ?? ZERO;

    const bounds = getLocalBounds(entity);

    let groundY = heightAt(x, z);

    if (sampling === "highest") {
      for (const point of bounds.points) {
        groundY = Math.max(
          groundY,
          heightAt(x + point.x, z + point.z)
        );
      }
    }

    const anchorOffset =
      anchor === "bottom" ? -bounds.minY : 0;

    return {
      ...entity,
      terrainAlign: false,
      position: [
        x,
        groundY + offsetY + clearance + anchorOffset,
        z,
      ],
    };
  }

  /**
   * Create a raised platform using boxes.
   *
   * topHeight measures from the chosen terrain
   * reference to the upper surface of the deck.
   */
  function raisedPlatform({
    id,
    position = ZERO,
    rotation = ZERO,
    size = [3, 0.25, 4],
    topHeight = 1.5,
    supports = true,
    supportWidth = 0.25,
    color = "#80664c",
    supportColor = color,
    sampling = "highest",
  } = {}) {
    const [width, thickness, length] = size;

    positive(width, "Platform width");
    positive(thickness, "Platform thickness");
    positive(length, "Platform length");

    if (topHeight < thickness) {
      throw new Error(
        "topHeight must be at least deck thickness"
      );
    }

    const deckY = topHeight - thickness / 2;

    const parts = [
      brick.box(
        size,
        [0, deckY, 0],
        { id: "deck", color }
      ),
    ];

    const legHeight = topHeight - thickness;

    if (supports && legHeight > 0) {
      const legWidth = Math.min(
        positive(supportWidth, "Support width"),
        width,
        length
      );

      const offsetX = (width - legWidth) / 2;
      const offsetZ = (length - legWidth) / 2;

      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          parts.push(
            brick.box(
              [legWidth, legHeight, legWidth],
              [
                sx * offsetX,
                legHeight / 2,
                sz * offsetZ,
              ],
              {
                id: `leg-${sx}-${sz}`,
                color: supportColor,
              }
            )
          );
        }
      }
    }

    const structure = assembly({
      id,
      position,
      rotation,
      parts,
    });

    return placeOnTerrain(structure, {
      anchor: "origin",
      sampling,
    });
  }

  /**
   * Join two WORLD-SPACE points on the desired
   * upper surface of a straight ramp.
   *
   * from/to: [x, topY, z]
   */
  function connectWithRamp({
    id,
    from,
    to,
    width = 2,
    thickness = 0.18,
    color = "#a58a64",
    friction = 0.85,
    restitution = 0.05,
  }) {
    if (
      !Array.isArray(from) ||
      !Array.isArray(to) ||
      from.length !== 3 ||
      to.length !== 3 ||
      ![...from, ...to].every(Number.isFinite)
    ) {
      throw new Error(
        "Ramp endpoints must be finite [x,y,z] positions"
      );
    }

    positive(width, "Ramp width");
    positive(thickness, "Ramp thickness");

    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const rise = to[1] - from[1];

    const horizontal = Math.hypot(dx, dz);

    if (horizontal < 0.001) {
      throw new Error(
        "Ramp endpoints need horizontal separation"
      );
    }

    // Local -Z points from "from" toward "to".
    const dirX = dx / horizontal;
    const dirZ = dz / horizontal;

    const pitch = Math.atan2(rise, horizontal);
    const yaw = Math.atan2(-dirX, -dirZ);

    const slopeLength = Math.hypot(
      horizontal,
      rise
    );

    // Apply pitch in local space, then world yaw.
    const rotationQ = new Quaternion()
      .setFromAxisAngle(UP, yaw)
      .multiply(
        new Quaternion()
          .setFromAxisAngle(RIGHT, pitch)
      );

    const euler = new Euler()
      .setFromQuaternion(rotationQ, "XYZ");

    const halfThickness = thickness / 2;

    // Offset the body so the ramp's TOP surface
    // joins exactly at the requested endpoints.
    const shift =
      halfThickness * Math.sin(pitch);

    const center = [
      (from[0] + to[0]) / 2 + dirX * shift,

      (from[1] + to[1]) / 2 -
        halfThickness * Math.cos(pitch),

      (from[2] + to[2]) / 2 + dirZ * shift,
    ];

    return assembly({
      id,
      position: center,
      rotation: [euler.x, euler.y, euler.z],
      terrainAlign: false,
      friction,
      restitution,

      parts: [
        brick.box(
          [width, thickness, slopeLength],
          ZERO,
          {
            id: "ramp-deck",
            color,
          }
        ),
      ],
    });
  }

  return {
    heightAt,
    placeOnTerrain,
    raisedPlatform,
    connectWithRamp,
  };
}
