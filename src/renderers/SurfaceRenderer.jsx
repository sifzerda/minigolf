// src/renderers/SurfaceRenderer.jsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as THREE from "three";

import {
  RigidBody,
  CuboidCollider,
  TrimeshCollider,
  useBeforePhysicsStep,
} from "@react-three/rapier";

import { buildWaterBasin } from "../terrain/WaterBasinBuilder.js";

import { BALL_RADIUS } from "../ecs/constants/physics.js";
import useGameStore from "../store/useGameStore.js";
import { resetBall } from "../ecs/systems/ShotSystem.js";
import { useGamePaused } from "../context/GamePauseContext.jsx";
import WaterSplash from "./WaterSplash.jsx";

const DEFAULT_WATER = "#1479a8";
const BASIN_COLOR = "#52636a";
const EPSILON = 1e-5;

function getColliderData(geometry) {
  if (!geometry) return null;

  const position = geometry.getAttribute("position");

  if (!position || position.count < 3) {
    return null;
  }

  const vertices = new Float32Array(position.array);

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
}

function pointOnSegment(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];

  const lengthSquared = dx * dx + dz * dz;

  if (lengthSquared < EPSILON) {
    return (
      Math.hypot(x - a[0], z - a[1]) <= EPSILON
    );
  }

  const t = THREE.MathUtils.clamp(
    (
      (x - a[0]) * dx +
      (z - a[1]) * dz
    ) / lengthSquared,
    0,
    1
  );

  const closestX = a[0] + t * dx;
  const closestZ = a[1] + t * dz;

  return (
    Math.hypot(
      x - closestX,
      z - closestZ
    ) <= EPSILON
  );
}

function pointInRing(x, z, ring) {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const a = ring[i];
    const b = ring[j];

    if (pointOnSegment(x, z, a, b)) {
      return true;
    }

    const intersects =
      (a[1] > z) !== (b[1] > z) &&
      x <
        (
          (b[0] - a[0]) *
          (z - a[1])
        ) /
          (b[1] - a[1]) +
          a[0];

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInPolygon(x, z, polygon) {
  if (!polygon?.length) return false;

  if (!pointInRing(x, z, polygon[0])) {
    return false;
  }

  // Exclude holes inside the polygon.
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(x, z, polygon[i])) {
      return false;
    }
  }

  return true;
}

function pointInMultiPolygon(x, z, polygons) {
  return polygons.some((polygon) =>
    pointInPolygon(x, z, polygon)
  );
}

function getPolygonBounds(polygons) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [x, z] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
    }
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    length: maxZ - minZ,
  };
}

function WaterSurface({ entity, sections }) {
  const paused = useGamePaused();

  const ballRef = useRef(null);
  const triggeredRef = useRef(false);

  const [splash, setSplash] = useState(null);

  const basin = useMemo(
    () => buildWaterBasin(entity, sections),
    [entity, sections]
  );

  const wallCollider = useMemo(
    () => getColliderData(basin.wallGeometry),
    [basin]
  );

  const bottomCollider = useMemo(
    () => getColliderData(basin.bottomGeometry),
    [basin]
  );

  const bounds = useMemo(
    () => getPolygonBounds(basin.polygons),
    [basin]
  );

  useEffect(() => {
    return () => {
      basin.wallGeometry.dispose();
      basin.bottomGeometry.dispose();
      basin.waterGeometry.dispose();
    };
  }, [basin]);

  const respawnPosition =
    entity.respawnPosition ?? [0, 0.5, 0];

  function isGolfBall(event) {
    const body = event.other.rigidBody;
    const object = event.other.rigidBodyObject;

    return Boolean(
      body &&
      (
        object?.userData?.isGolfBall ||
        body?.userData?.isGolfBall
      )
    );
  }

  function handleEnter(event) {
    if (!isGolfBall(event)) return;

    ballRef.current = event.other.rigidBody;
  }

  function handleExit(event) {
    if (!isGolfBall(event)) return;

    if (
      ballRef.current === event.other.rigidBody
    ) {
      ballRef.current = null;
    }

    triggeredRef.current = false;
  }

  useBeforePhysicsStep(() => {
    if (paused || triggeredRef.current) {
      return;
    }

    const ball = ballRef.current;

    if (!ball || !bounds) return;

    const position = ball.translation();

    // Broad-phase bounding-box test.
    if (
      position.x < bounds.minX - BALL_RADIUS ||
      position.x > bounds.maxX + BALL_RADIUS ||
      position.z < bounds.minZ - BALL_RADIUS ||
      position.z > bounds.maxZ + BALL_RADIUS
    ) {
      return;
    }

    // The ball must descend to water level.
    if (
      position.y - BALL_RADIUS >
      basin.waterY + 0.05
    ) {
      return;
    }

    // Exact polygon test.
    if (
      !pointInMultiPolygon(
        position.x,
        position.z,
        basin.polygons
      )
    ) {
      return;
    }

    const state = useGameStore.getState();

    if (state.completed || state.gameComplete) {
      return;
    }

    triggeredRef.current = true;

    setSplash({
      id: Date.now(),
      position: [
        position.x,
        basin.waterY + 0.025,
        position.z,
      ],
    });

    state.recordStroke();

    resetBall(
      ball,
      respawnPosition,
      null
    );
  });

  if (
    !bounds ||
    basin.polygons.length === 0
  ) {
    return null;
  }

  // Sensor spans the recessed basin and
  // extends above its upper edge.
  const sensorHeight =
    basin.floorY - basin.bottomY +
    BALL_RADIUS * 4;

  const sensorCenterY =
    (basin.floorY + basin.bottomY) / 2;

  return (
    <group>
      {/* Fixed physical basin */}
      <RigidBody
        type="fixed"
        colliders={false}
      >
        {wallCollider && (
          <TrimeshCollider
            args={wallCollider}
            friction={0.8}
            restitution={0.1}
          />
        )}

        {bottomCollider && (
          <TrimeshCollider
            args={bottomCollider}
            friction={0.8}
            restitution={0.05}
          />
        )}
      </RigidBody>

      {/* Basin side walls */}
      <mesh
        geometry={basin.wallGeometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={
            entity.basinColor ??
            BASIN_COLOR
          }
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Basin bottom */}
      <mesh
        geometry={basin.bottomGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          color={
            entity.basinColor ??
            BASIN_COLOR
          }
          roughness={0.95}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Transparent water */}
      <mesh geometry={basin.waterGeometry}>
        <meshPhysicalMaterial
          color={
            entity.color ??
            DEFAULT_WATER
          }
          transparent
          opacity={0.75}
          roughness={0.08}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Broad-phase sensor */}
      <RigidBody
        type="fixed"
        colliders={false}
      >
        <CuboidCollider
          args={[
            Math.max(
              0.01,
              bounds.width / 2 +
                BALL_RADIUS
            ),
            sensorHeight / 2,
            Math.max(
              0.01,
              bounds.length / 2 +
                BALL_RADIUS
            ),
          ]}
          position={[
            bounds.centerX,
            sensorCenterY,
            bounds.centerZ,
          ]}
          sensor
          onIntersectionEnter={handleEnter}
          onIntersectionExit={handleExit}
        />
      </RigidBody>

      {/* Splash effect */}
      {splash && (
        <WaterSplash
          key={splash.id}
          position={splash.position}
          onComplete={() =>
            setSplash(null)
          }
        />
      )}
    </group>
  );
}

export default function SurfaceRenderer({
  entity,
  sections = [],
}) {
  const surface =
    entity.surface ?? entity.type;

  if (surface === "water") {
    return (
      <WaterSurface
        entity={entity}
        sections={sections}
      />
    );
  }

  // Normal rectangular surface.
  if (!entity.size || !entity.position) {
    return null;
  }

  const [width, length] = entity.size;

  return (
    <mesh
      position={[
        entity.position[0],
        entity.position[1] + 0.012,
        entity.position[2],
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry
        args={[width, length]}
      />

      <meshStandardMaterial
        color={
          entity.color ?? "#328b50"
        }
        roughness={
          surface === "ice"
            ? 0.15
            : 0.95
        }
        metalness={
          surface === "ice"
            ? 0.2
            : 0
        }
      />
    </mesh>
  );
}
