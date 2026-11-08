// src/renderers/AimGuide.jsx

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { Ray } from "@dimforge/rapier3d-compat";

import {
  BufferGeometry,
  Float32BufferAttribute,
  DynamicDrawUsage,
} from "three";

import useGameStore from "../store/useGameStore";
import { BALL_RADIUS } from "../ecs/constants/physics";
import { getShotDirection } from "../ecs/systems/ShotSystem";
import { renderActivity } from "../utils/renderActivity";

// Guide appearance
const GUIDE_LENGTH = 3;
const GUIDE_STEP = 0.12;
const GUIDE_HEIGHT = 0.07;
const GUIDE_SIZE = 0.085;

// Terrain sampling
const MAX_STEP_UP = 0.35;
const MAX_STEP_DOWN = 0.6;
const RAY_MARGIN = 0.08;

// Performance
const REFRESH_INTERVAL = 200;
const POSITION_EPSILON = 0.005;

const MAX_POINTS =
  Math.ceil(GUIDE_LENGTH / GUIDE_STEP) + 1;

const DOWN = { x: 0, y: -1, z: 0 };

function createGeometry() {
  const geometry = new BufferGeometry();

  const attribute = new Float32BufferAttribute(
    new Float32Array(MAX_POINTS * 3),
    3
  );

  attribute.setUsage(DynamicDrawUsage);

  geometry.setAttribute("position", attribute);
  geometry.setDrawRange(0, 0);

  return geometry;
}

function inputsChanged(previous, next) {
  if (!previous) return true;

  return (
    previous.angle !== next.angle ||
    Math.abs(previous.x - next.x) >
      POSITION_EPSILON ||
    Math.abs(previous.y - next.y) >
      POSITION_EPSILON ||
    Math.abs(previous.z - next.z) >
      POSITION_EPSILON
  );
}

export default function AimGuide({
  ballRef,
  settledRef,
}) {
  const { world } = useRapier();

  const guideRef = useRef(null);
  const previousInput = useRef(null);
  const lastUpdate = useRef(0);

  const geometry = useMemo(
    () => createGeometry(),
    []
  );

  const attribute = useMemo(
    () => geometry.getAttribute("position"),
    [geometry]
  );

  const ray = useMemo(
    () =>
      new Ray(
        { x: 0, y: 0, z: 0 },
        DOWN
      ),
    []
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(() => {
    const guide = guideRef.current;
    const ball = ballRef.current;

    if (!guide || !ball || !world) return;

    const state = useGameStore.getState();

    const visible =
      !state.completed &&
      !state.gameComplete &&
      Boolean(settledRef.current);

    if (guide.visible !== visible) {
      guide.visible = visible;
      renderActivity.wake(100);
    }

    if (!visible) {
      previousInput.current = null;
      return;
    }

    const position = ball.translation();

    const input = {
      angle: state.aimAngle,
      x: position.x,
      y: position.y,
      z: position.z,
    };

    const now = performance.now();

    if (
      !inputsChanged(previousInput.current, input) &&
      now - lastUpdate.current < REFRESH_INTERVAL
    ) {
      return;
    }

    const direction = getShotDirection(input.angle);
    const array = attribute.array;

    let count = 0;

    let previousGroundY =
      position.y - BALL_RADIUS;

    for (let i = 0; i < MAX_POINTS; i++) {
      const distance = Math.min(
        i * GUIDE_STEP,
        GUIDE_LENGTH
      );

      const x =
        position.x + direction.x * distance;

      const z =
        position.z + direction.z * distance;

      // Start just above the previous terrain
      // height to avoid overhead surfaces.
      const originY =
        previousGroundY +
        MAX_STEP_UP +
        RAY_MARGIN;

      ray.origin.x = x;
      ray.origin.y = originY;
      ray.origin.z = z;

      const rayLength =
        MAX_STEP_UP +
        MAX_STEP_DOWN +
        RAY_MARGIN;

      const hit = world.castRayAndGetNormal(
        ray,
        rayLength,
        true,
        undefined,
        undefined,
        undefined,
        ball
      );

      if (!hit) break;

      // Ignore steep vertical surfaces.
      if (hit.normal.y < 0.55) break;

      const groundY =
        originY - hit.timeOfImpact;

      const difference =
        groundY - previousGroundY;

      if (
        difference > MAX_STEP_UP ||
        difference < -MAX_STEP_DOWN
      ) {
        break;
      }

      const index = count * 3;

      array[index] = x;
      array[index + 1] =
        groundY + GUIDE_HEIGHT;
      array[index + 2] = z;

      previousGroundY = groundY;
      count++;
    }

    attribute.needsUpdate = true;

    geometry.setDrawRange(0, count);

    previousInput.current = input;
    lastUpdate.current = now;

    renderActivity.wake(100);
  });

  return (
    <points
      ref={guideRef}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={10}
      visible={false}
    >
      <pointsMaterial
        color="#a3ff12"
        size={GUIDE_SIZE}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}
