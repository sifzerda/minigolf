// src/renderers/LoopObstacle.jsx

import { useEffect, useMemo } from "react";

import {
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
  Vector3,
} from "three";

import {
  RigidBody,
  TrimeshCollider,
} from "@react-three/rapier";

import { BALL_RADIUS } from "../ecs/constants/physics.js";

const TAU = Math.PI * 2;
const EPSILON = 1e-6;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const smoothstep = (t) => t * t * (3 - 2 * t);

function createStripGeometry(left, right, normals) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i < left.length; i++) {
    vertices.push(
      left[i].x,
      left[i].y,
      left[i].z,
      right[i].x,
      right[i].y,
      right[i].z
    );
  }

  for (let i = 0; i < left.length - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;

    // Choose winding so the track's collision
    // normals point toward the playable side.
    const forward = left[i + 1]
      .clone()
      .sub(left[i]);

    const across = right[i]
      .clone()
      .sub(left[i]);

    const faceNormal = forward
      .clone()
      .cross(across);

    const desired = normals[i];

    if (faceNormal.dot(desired) >= 0) {
      indices.push(
        a, c, b,
        b, c, d
      );
    } else {
      indices.push(
        a, b, c,
        b, d, c
      );
    }
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(vertices, 3)
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

function createTrack(entity, mode) {
  const radius = Math.max(
    0.8,
    entity.radius ?? 1.6
  );

  const width = Math.max(
    0.65,
    entity.width ?? 1.3
  );

  const segments = clamp(
    Math.floor(entity.segments ?? 128),
    48,
    256
  );

  const railHeight = Math.max(
    0.08,
    entity.railHeight ?? 0.3
  );

  const approachLength = Math.max(
    0,
    entity.approachLength ?? 1.5
  );

  const departureLength = Math.max(
    0,
    entity.departureLength ?? 1.5
  );

  const groundY = entity.groundY ?? 0.04;

  const isVertical = mode === "verticalLoop";
  const isInclined = mode === "inclinedLoop";

  const rise = isInclined
    ? Math.max(0.25, entity.rise ?? 1.1)
    : 0;

  // A complete turn needs sufficient separation
  // between its beginning and end.
  //
  // Include the ball diameter and a safety margin
  // so parallel track lanes cannot block each other.
  const minimumOffset =
    width + BALL_RADIUS * 2 + 0.45;

  const offset = Math.max(
    minimumOffset,
    entity.exitOffset ?? 3.6
  );

  // A complete circle with lateral separation.
  //
  // Vertical:
  //   X separates entrance and exit.
  //   Y/Z form the vertical circular loop.
  //
  // Horizontal:
  //   X/Z form the curved track.
  //   X separation prevents the loop from closing
  //   onto its own entrance.
  //
  // Inclined:
  //   Same as horizontal, but rises gradually.
  function core(t) {
    const angle = TAU * t;

    if (isVertical) {
      return new Vector3(
        offset * t,
        groundY +
          radius * (1 - Math.cos(angle)),
        -radius * Math.sin(angle)
      );
    }

    return new Vector3(
      offset * t +
        radius * (1 - Math.cos(angle)),
      groundY + rise * t,
      -radius * Math.sin(angle)
    );
  }

  const start = core(0);
  const end = core(1);

  const tangentStart = core(EPSILON)
    .sub(start)
    .normalize();

  const tangentEnd = end
    .clone()
    .sub(core(1 - EPSILON))
    .normalize();

  const centers = [];

  const accessSegments = Math.max(
    8,
    Math.round(segments * 0.15)
  );

  // Straight entrance, tangent to the loop.
  for (
    let i = accessSegments;
    i >= 1;
    i--
  ) {
    const distance =
      approachLength * i / accessSegments;

    centers.push(
      start
        .clone()
        .addScaledVector(
          tangentStart,
          -distance
        )
    );
  }

  // Main loop.
  for (let i = 0; i <= segments; i++) {
    centers.push(core(i / segments));
  }

  // Exit follows the final tangent.
  //
  // Inclined loops descend gradually after
  // the circular section.
  for (
    let i = 1;
    i <= accessSegments;
    i++
  ) {
    const t = i / accessSegments;

    const point = end
      .clone()
      .addScaledVector(
        tangentEnd,
        departureLength * t
      );

    if (isInclined) {
      point.y -= rise * smoothstep(t);
    }

    centers.push(point);
  }

  const left = [];
  const right = [];

  const leftRailTop = [];
  const rightRailTop = [];

  const deckNormals = [];
  const leftRailNormals = [];
  const rightRailNormals = [];

  for (let i = 0; i < centers.length; i++) {
    const previous =
      centers[Math.max(0, i - 1)];

    const next =
      centers[Math.min(
        centers.length - 1,
        i + 1
      )];

    const tangent = next
      .clone()
      .sub(previous)
      .normalize();

    let across;
    let normal;

    if (isVertical) {
      // Keep the deck's width oriented along X.
      // This avoids sudden frame flips when the
      // loop passes through its vertical sections.
      across = new Vector3(1, 0, 0);

      normal = across
        .clone()
        .cross(tangent)
        .normalize();
    } else {
      // Horizontal perpendicular to travel.
      across = new Vector3(
        tangent.z,
        0,
        -tangent.x
      );

      if (across.lengthSq() < EPSILON) {
        across.set(1, 0, 0);
      }

      across.normalize();

      // Surface normal follows the incline.
      normal = tangent
        .clone()
        .cross(across)
        .normalize();

      if (normal.y < 0) {
        across.negate();
        normal.negate();
      }
    }

    const leftPoint = centers[i]
      .clone()
      .addScaledVector(
        across,
        width / 2
      );

    const rightPoint = centers[i]
      .clone()
      .addScaledVector(
        across,
        -width / 2
      );

    left.push(leftPoint);
    right.push(rightPoint);

    leftRailTop.push(
      leftPoint
        .clone()
        .addScaledVector(
          normal,
          railHeight
        )
    );

    rightRailTop.push(
      rightPoint
        .clone()
        .addScaledVector(
          normal,
          railHeight
        )
    );

    deckNormals.push(normal);

    leftRailNormals.push(
      across.clone()
    );

    rightRailNormals.push(
      across.clone().negate()
    );
  }

  return {
    deck: createStripGeometry(
      left,
      right,
      deckNormals
    ),

    leftRail: createStripGeometry(
      left,
      leftRailTop,
      leftRailNormals
    ),

    rightRail: createStripGeometry(
      right,
      rightRailTop,
      rightRailNormals
    ),

    centerPoints: centers,
    radius,
    width,
    offset,
  };
}

function TrackPart({
  part,
  color,
  friction,
  restitution,
  metalness = 0.1,
}) {
  return (
    <>
      <TrimeshCollider
        args={[
          part.vertices,
          part.indices,
        ]}
        friction={friction}
        restitution={restitution}
      />

      <mesh
        geometry={part.geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          side={DoubleSide}
          metalness={metalness}
          roughness={0.6}
        />
      </mesh>
    </>
  );
}

export default function LoopObstacle({
  entity,
  mode,
}) {
  const track = useMemo(
    () => createTrack(entity, mode),
    [entity, mode]
  );

  useEffect(() => {
    return () => {
      track.deck.geometry.dispose();
      track.leftRail.geometry.dispose();
      track.rightRail.geometry.dispose();
    };
  }, [track]);

  const friction =
    entity.friction ?? 0.65;

  const restitution =
    entity.restitution ?? 0.08;

  const color =
    entity.color ??
    (
      mode === "verticalLoop"
        ? "#f4c542"
        : mode === "inclinedLoop"
          ? "#ef4444"
          : "#facc15"
    );

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={
        entity.position ?? [0, 0, 0]
      }
      rotation={
        entity.rotation ?? [0, 0, 0]
      }
    >
      <TrackPart
        part={track.deck}
        color={color}
        friction={friction}
        restitution={restitution}
      />

      {entity.rails !== false && (
        <>
          <TrackPart
            part={track.leftRail}
            color={
              entity.railColor ?? color
            }
            friction={friction}
            restitution={restitution}
          />

          <TrackPart
            part={track.rightRail}
            color={
              entity.railColor ?? color
            }
            friction={friction}
            restitution={restitution}
          />
        </>
      )}
    </RigidBody>
  );
}

export function VerticalLoop({ entity }) {
  return (
    <LoopObstacle
      entity={entity}
      mode="verticalLoop"
    />
  );
}

export function HorizontalLoop({ entity }) {
  return (
    <LoopObstacle
      entity={entity}
      mode="horizontalLoop"
    />
  );
}

export function InclinedLoop({ entity }) {
  return (
    <LoopObstacle
      entity={entity}
      mode="inclinedLoop"
    />
  );
}
